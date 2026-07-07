"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, List, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Hls from "hls.js";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";
import { useReelShortEpisode, usePrefetchReelShortEpisode, useReelShortEpisodes } from "@/hooks/useReelShort";
import { useHistoryStore } from "@/hooks/useHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { decryptData } from "@/lib/crypto";

interface VideoItem {
  url: string;
  encode: string;
  quality: number;
  bitrate: string;
}

interface DetailData {
  success: boolean;
  bookId: string;
  title: string;
  cover: string;
  totalEpisodes: number;
}

async function fetchDetail(bookId: string): Promise<DetailData> {
  const response = await fetch(`/api/reelshort/detail?bookId=${bookId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch detail");
  }
  const json = await response.json();
  if (json.data && typeof json.data === "string") {
    return decryptData(json.data);
  }
  return json;
}

export default function ReelShortWatchPage() {
  const params = useParams<{ bookId: string }>();
  const searchParams = useSearchParams();
  const bookId = params.bookId;
  const router = useRouter();

  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Ref untuk area swipe vertikal (mobile)
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  // Get episode from URL
  useEffect(() => {
    const ep = searchParams.get("ep");
    if (ep) {
      setCurrentEpisode(parseInt(ep) || 1);
    }
  }, [searchParams]);

  // Fetch detail for title and episode count
  const { data: detailData } = useQuery({
    queryKey: ["reelshort", "detail", bookId],
    queryFn: () => fetchDetail(bookId || ""),
    enabled: !!bookId,
  });

  // Fetch raw encrypted data
  const { data: rawEpisodeData, isLoading, error } = useReelShortEpisode(
    bookId || "",
    currentEpisode,
    !!bookId && currentEpisode > 0
  );

  // Fetch full episode list for sidebar
  const { data: episodesList } = useReelShortEpisodes(bookId || "");
  const { addToHistory } = useHistoryStore();

  useEffect(() => {
    if (detailData && currentEpisode) {
      addToHistory({
        id: bookId || "",
        title: detailData.title || "ReelShort",
        poster: detailData.cover || "",
        platform: "reelshort",
        episodeNumber: currentEpisode,
        link: `/watch/reelshort/${bookId}?ep=${currentEpisode}`
      });
    }
  }, [bookId, currentEpisode, detailData, addToHistory]);

  // Decrypt the data with safe typing
  const episodeData = useMemo(() => {
    if (!rawEpisodeData) return null;

    // Explicit type casting to avoid lint errors
    const raw = rawEpisodeData as any;

    // Case 1: Encrypted string in data property
    if (raw.data && typeof raw.data === 'string') {
      try {
        const decrypted = decryptData(raw.data);
        console.log("🔓 [Debug] Decrypted successfully:", decrypted);
        return decrypted;
      } catch (e) {
        console.error("🔐 [Debug] Decryption failed:", e);
        return null;
      }
    }

    // Case 2: Already decrypted or direct object
    if (raw.videoUrl || raw.videoList) return raw;

    // Case 3: Nested data fallback
    if (raw.data) return raw.data;

    return raw;
  }, [rawEpisodeData]);

  // DEBUGGING DATA MASUK
  useEffect(() => {
    console.log("📥 [Debug] Status:", { isLoading, hasRaw: !!rawEpisodeData, hasDecrypted: !!episodeData });
    if (episodeData) {
      const ep = episodeData as any;
      const url = ep.videoUrl || (ep.videoList && ep.videoList.length > 0 ? ep.videoList[0]?.url : "NONE");
      console.log("🔗 [Debug] Active URL will be:", url);
    }
  }, [episodeData, rawEpisodeData, isLoading]);

  // Prefetch next episode
  const prefetchEpisode = usePrefetchReelShortEpisode();

  useEffect(() => {
    const totalEpisodes = detailData?.totalEpisodes || 1;
    if (currentEpisode < totalEpisodes && bookId) {
      // Prefetch next episode after 2 seconds
      const timer = setTimeout(() => {
        prefetchEpisode(bookId, currentEpisode + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentEpisode, detailData?.totalEpisodes, bookId, prefetchEpisode]);

  // Get available quality options
  const qualityOptions = useMemo(() => {
    if (!episodeData) return [];

    const ep = episodeData as any;

    // Handle videoList structure (multiple qualities)
    if (ep.videoList && Array.isArray(ep.videoList)) {
      return ep.videoList.map((video: any, index: number) => {
        // quality=0 with H265 means 1080p
        let qualityLabel = "";
        if (video.quality === 0) {
          qualityLabel = `1080p (${video.encode})`;
        } else {
          qualityLabel = `${video.quality}p (${video.encode})`;
        }

        return {
          id: `${video.encode}-${video.quality}-${index}`,
          label: qualityLabel,
          quality: video.quality === 0 ? 1080 : video.quality,
          video,
        };
      }).sort((a: any, b: any) => b.quality - a.quality); // Sort by quality descending
    }

    // Handle direct videoUrl structure (single quality)
    if (ep.videoUrl) {
      return [{
        id: 'default',
        label: 'Default',
        quality: 720,
        video: {
          url: ep.videoUrl,
          encode: 'H264',
          quality: 720,
          bitrate: 'default'
        }
      }];
    }

    return [];
  }, [episodeData]);

  // Get current video URL based on selected quality
  const getCurrentVideoUrl = useCallback(() => {
    if (!episodeData) return null;

    const ep = episodeData as any;

    // If we have videoList, use quality selection
    if (ep.videoList && Array.isArray(ep.videoList)) {
      if (selectedQuality === "auto" || !qualityOptions.length) {
        // Default: prefer H264 for compatibility
        const h264Video = ep.videoList.find((v: any) => v.encode === "H264");
        return h264Video || ep.videoList[0];
      }

      const selected = qualityOptions.find((q: any) => q.id === selectedQuality);
      return selected?.video || ep.videoList[0];
    }

    // If we have direct videoUrl, return it
    if (ep.videoUrl) {
      return {
        url: ep.videoUrl,
        encode: 'H264',
        quality: 720
      };
    }

    return null;
  }, [episodeData, selectedQuality, qualityOptions]);

  // Persistent Active URL State
  const [activeUrl, setActiveUrl] = useState("");

  useEffect(() => {
    const currentVideo = getCurrentVideoUrl();
    if (currentVideo?.url) {
      setActiveUrl(text => {
        if (text !== currentVideo.url) return currentVideo.url;
        return text;
      });
    }
  }, [getCurrentVideoUrl]);

  // Load video source
  const loadVideo = useCallback((videoUrl: string) => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    console.log("🎬 Loading Video URL:", videoUrl);

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
      });

      hlsRef.current = hls;

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("✅ Manifest Parsed, playing...");
        
        // Auto-select Indonesian subtitle track if available
        if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
          console.log("📝 Available Subtitle Tracks:", hls.subtitleTracks.map(t => ({ id: t.id, name: t.name, lang: t.lang })));
          
          const idTrackIndex = hls.subtitleTracks.findIndex((t) => {
            const lang = t.lang?.toLowerCase() || '';
            const name = t.name?.toLowerCase() || '';
            return lang === 'id' || lang === 'ind' || lang === 'in' || 
                   name.includes('indonesia') || name.includes('indo');
          });
          
          if (idTrackIndex !== -1) {
            hls.subtitleTrack = idTrackIndex;
            console.log(`✅ Default subtitle set to Indonesian (Track ${idTrackIndex})`);
          }
        }

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => console.error("⚠️ Autoplay error:", e));
        }
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("❌ HLS Network Error:", data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("❌ HLS Media Error:", data);
              hls.recoverMediaError();
              break;
            default:
              console.error("❌ HLS Fatal Error:", data);
              hls.destroy();
              break;
          }
        } else {
          console.warn("⚠️ HLS Warning:", data);
        }
      });

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari/iOS)
      video.src = videoUrl;
      video.play().catch((e) => console.error("⚠️ Native Play Error:", e));
    }
  }, []);

  // Setup HLS player when activeUrl changes
  useEffect(() => {
    if (!activeUrl || !videoRef.current) return;

    // Gunakan referer asli situs agar diizinkan oleh CDN
    loadVideo(activeUrl);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeUrl, loadVideo]);

  // Handle video ended - auto next episode
  const handleVideoEnded = useCallback(() => {
    const totalEpisodes = detailData?.totalEpisodes || 1;
    if (currentEpisode < totalEpisodes) {
      const nextEp = currentEpisode + 1;
      setCurrentEpisode(nextEp);
      window.history.replaceState(null, '', `/watch/reelshort/${bookId}?ep=${nextEp}`);
    }
  }, [currentEpisode, detailData?.totalEpisodes, bookId]);

  const goToEpisode = (ep: number) => {
    setCurrentEpisode(ep);
    router.replace(`/watch/reelshort/${bookId}?ep=${ep}`, { scroll: false });
    setShowEpisodeList(false);
  };

  const totalEpisodes = detailData?.totalEpisodes || 1;

  // Swipe vertikal untuk navigasi episode di mobile & Double tap untuk full screen
  useEffect(() => {
    const el = swipeContainerRef.current;
    if (!el) return;

    let touchStartY = 0;
    let lastTap = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Double tap zoom feature
      if (e.changedTouches.length === 1) {
          const currentTime = new Date().getTime();
          const tapLength = currentTime - lastTap;
          if (tapLength < 300 && tapLength > 0) {
              setIsZoomed(!isZoomed);
              e.preventDefault();
          }
          lastTap = currentTime;
      }

      // Hanya aktif di mobile
      if (window.innerWidth >= 768) return;

      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;

      // Threshold 80px agar tidak konflik dengan tap kontrol video
      if (Math.abs(deltaY) > 80) {
        if (deltaY > 80 && currentEpisode < totalEpisodes) goToEpisode(currentEpisode + 1);
        else if (deltaY < -80 && currentEpisode > 1) goToEpisode(currentEpisode - 1);
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentEpisode, totalEpisodes, isZoomed]);

    return (
        <main className="fixed inset-0 bg-black flex flex-col overflow-hidden">
            {/* Custom Subtitle Styling VIP - Ultra Force */}
            <style dangerouslySetInnerHTML={{
                __html: `
                video::cue {
                    color: #ffffff !important;
                    background-color: rgba(0, 0, 0, 0) !important;
                    text-shadow: 
                        2px 2px 0 #000,
                       -2px -2px 0 #000,
                        2px -2px 0 #000,
                       -2px  2px 0 #000,
                        0 2px 4px rgba(0,0,0,0.8),
                        0 0 10px rgba(0,0,0,1) !important;
                    font-family: "Inter", -apple-system, sans-serif !important;
                    font-size: 1.15rem !important;
                    font-weight: 800 !important;
                }
                `
            }} />

            {/* Header - Fixed Overlay with improved visibility */}
            <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />

                <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          {/* Header content... */}
          <Link
            href={`/detail/reelshort/${bookId}`}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
            <div className="flex flex-col -gap-1">
              <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md leading-none">DRACINDO</span>
              <span className="text-[10px] text-white/70 hidden sm:inline leading-none">PUSAT DRAMA</span>
            </div>
          </Link>

          <div className="text-center flex-1 px-4 min-w-0">
            <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">
              {detailData?.title || "Loading..."}
            </h1>
            <p className="text-white/80 text-xs drop-shadow-md">Episode {currentEpisode}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10">
                  <Settings className="w-6 h-6 drop-shadow-md" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[100]">
                <DropdownMenuItem
                  onClick={() => setSelectedQuality("auto")}
                  className={selectedQuality === "auto" ? "text-primary font-semibold" : ""}
                >
                  Auto (H264)
                </DropdownMenuItem>
                {qualityOptions.map((option: any) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => setSelectedQuality(option.id)}
                    className={selectedQuality === option.id ? "text-primary font-semibold" : ""}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Episode List Toggle */}
            <button
              onClick={() => setShowEpisodeList(!showEpisodeList)}
              className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <List className="w-6 h-6 drop-shadow-md" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div ref={swipeContainerRef} className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
        {/* Video Element Wrapper */}
        <div className="relative w-full h-full flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-20">
              <AlertCircle className="w-10 h-10 text-destructive mb-4" />
              <p className="text-white mb-4">Gagal memuat video</p>
              <button
                onClick={() => router.refresh()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {episodeData?.isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-center p-4 z-20">
              <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
              <p className="text-white text-lg font-medium mb-4">Episode ini terkunci</p>
              <Link
                href={`/detail/reelshort/${bookId}`}
                className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                Kembali ke Detail
              </Link>
            </div>
          )}

          {/* Video Player */}
            <video
              ref={videoRef}
              className={`w-full h-full max-h-[100dvh] transition-all duration-300 ${isZoomed ? "object-cover" : "object-contain"}`}
              controlsList="nofullscreen"
              controls
              playsInline
              autoPlay
              {...({ disableRemotePlayback: true } as any)}
              onEnded={handleVideoEnded}
            />
        </div>

        {/* Navigation Controls Overlay - Bottom */}
        <UnifiedVideoNavigation
          isHidden={isZoomed}
          currentEpisode={currentEpisode}
          totalEpisodes={totalEpisodes}
          onPrev={() => currentEpisode > 1 && goToEpisode(currentEpisode - 1)}
          onNext={() => currentEpisode < totalEpisodes && goToEpisode(currentEpisode + 1)}
        />
      </div>

      {/* Episode List Sidebar */}
      {showEpisodeList && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setShowEpisodeList(false)}
          />
          <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900 z-[70] overflow-y-auto border-l border-white/10 shadow-2xl animate-in slide-in-from-right">
            <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white">Daftar Episode</h2>
                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                  Total {totalEpisodes}
                </span>
              </div>
              <button
                onClick={() => setShowEpisodeList(false)}
                className="p-1 text-white/70 hover:text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-5 gap-2">
              {(episodesList || Array.from({ length: totalEpisodes }, (_, i) => ({ chapterIndex: i + 1, chapterId: (i + 1).toString() }))).map((ep: any) => {
                const epNum = ep.chapterIndex;
                return (
                  <button
                    key={ep.chapterId || epNum}
                    onClick={() => goToEpisode(epNum)}
                    className={`
                      aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                      ${epNum === currentEpisode
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >
                    {epNum}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
