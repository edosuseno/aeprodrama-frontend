
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMeloloDetail, useMeloloStream } from "@/hooks/useMelolo";
import { useHistoryStore } from "@/hooks/useHistory";
import { ChevronLeft, ChevronRight, Loader2, List, AlertCircle, Settings } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Hls from "hls.js";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

export default function MeloloWatchPage() {
  const params = useParams<{ bookId: string; videoId: string }>();
  const router = useRouter();
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Internal state for videoId to prevent page unmount/remount on navigation
  const [currentVideoId, setCurrentVideoId] = useState(params.videoId || "");

  // Ref untuk area swipe vertikal (mobile)
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  // Sync state with params if they change externally (e.g. back button)
  useEffect(() => {
    if (params.videoId && params.videoId !== currentVideoId) {
      setCurrentVideoId(params.videoId);
    }
  }, [params.videoId]);

  // Keep previous data to avoid unmounting video during transitions
  const { data: detailData, isLoading: detailLoading } = useMeloloDetail(params.bookId || "");
  const { data: streamData, isLoading: streamLoading, isFetching: streamFetching } = useMeloloStream(currentVideoId);
  const { addToHistory } = useHistoryStore();

  const drama = detailData?.data?.video_data;

  // Ekstrak URL video, subtitle, dan qualities dari streamData
  const { processedVideoUrl, processedSubtitleUrl, qualities } = useMemo(() => {
    const streamObj = streamData as any;
    if (!streamObj) return { processedVideoUrl: "", processedSubtitleUrl: "", qualities: [] };

    // Coba ambil URL dari berbagai kemungkinan format
    const rawUrl = streamObj?.url ||
                   streamObj?.data?.url ||
                   streamObj?.data?.main_url ||
                   streamObj?.data?.play_url ||
                   streamObj?.data?.playUrl ||
                   streamObj?.data?.videoUrl ||
                   streamObj?.data?.video_url ||
                   streamObj?.main_url ||
                   streamObj?.play_url ||
                   streamObj?.playUrl ||
                   streamObj?.videoUrl ||
                   streamObj?.video_url || "";

    const rawSubtitle = streamObj?.subtitle ||
                        streamObj?.data?.subtitle || "";

    const rawQualities = streamObj?.qualities || streamObj?.data?.video_model || [];
    let extractedQualities: { name: string, url: string }[] = [];
    
    if (Array.isArray(rawQualities)) {
      extractedQualities = rawQualities.map(q => ({
        name: q.label || q.definition || q.name || "Unknown",
        url: q.url
      })).filter(q => q.url);
    }

    if (!rawUrl && extractedQualities.length === 0) return { processedVideoUrl: "", processedSubtitleUrl: "", qualities: [] };

    // Helper proxy: Gunakan /api/proxy/video untuk streaming MP4/TS agar tidak memenuhi memori
    const addProxyIfNeeded = (url: string) => {
      if (!url) return url;
      
      // Bypass proxy untuk server Melolo V3 (inicdn) karena tidak memerlukan CORS/Referer
      // dan proxy MP4 di Vercel akan menyebabkan timeout / payload too large (layar hitam / tombol abu)
      if (url.includes("inicdn.net")) {
          return url;
      }
      
      if (url.startsWith("http") && !url.includes("vidrama.asia/api/video-proxy")) {
        const proxyPath = '/api/proxy';
        return `${proxyPath}?url=${encodeURIComponent(url)}&referer=${encodeURIComponent('https://vidrama.asia/')}&is_mp4=1`;
      }
      return url;
    };

    let pUrl = addProxyIfNeeded(rawUrl || (extractedQualities.length > 0 ? extractedQualities[0].url : ""));
    
    // Proses subtitle URL
    let pSub = rawSubtitle;
    if (pSub && pSub.startsWith("http")) {
      if (!pSub.startsWith("/api/proxy") && !pSub.includes("vercel.app")) {
        pSub = `/api/proxy?url=${encodeURIComponent(pSub)}&referer=${encodeURIComponent('https://vidrama.asia/')}`;
      }
    }

    // Proxy qualities URL
    const processedQualities = extractedQualities.map(q => ({
      name: q.name,
      url: addProxyIfNeeded(q.url)
    }));

    return { processedVideoUrl: pUrl, processedSubtitleUrl: pSub, qualities: processedQualities };
  }, [streamData]);

  const [selectedQuality, setSelectedQuality] = useState<{name: string, url: string} | null>(null);

  useEffect(() => {
    if (qualities.length > 0) {
      setSelectedQuality(prev => {
        if (prev) {
          const match = qualities.find(q => q.name === prev.name);
          if (match) return match;
        }
        // Default ke kualitas terbaik atau pertama
        return qualities[0];
      });
    } else {
      setSelectedQuality(null);
    }
  }, [qualities]);

  // Find current episode index
  const currentEpisodeIndex = drama?.video_list?.findIndex(v => v.vid === currentVideoId) ?? -1;
  const totalEpisodes = drama?.video_list?.length || 0;

  // Fitur Riwayat Terisolasi
  useEffect(() => {
    if (drama && currentVideoId && currentEpisodeIndex !== -1) {
      addToHistory({
        id: params.bookId || "",
        title: drama.series_title || "Melolo",
        poster: drama.series_cover || drama.cover || "",
        platform: "melolo",
        episodeNumber: currentEpisodeIndex + 1,
        link: `/watch/melolo/${params.bookId}/${currentVideoId}`
      });
    }
  }, [params.bookId, currentVideoId, drama, addToHistory, currentEpisodeIndex]);

  const handleEpisodeChange = (index: number) => {
    if (!drama?.video_list?.[index]) return;
    const nextVideoId = drama.video_list[index].vid;

    // Update internal state
    setCurrentVideoId(nextVideoId);

    // Update URL without triggering navigation
    const newUrl = `/watch/melolo/${params.bookId}/${nextVideoId}`;
    window.history.pushState({ path: newUrl }, "", newUrl);

    setShowEpisodeList(false);
  };

  const handleVideoEnded = () => {
    if (currentEpisodeIndex !== -1 && currentEpisodeIndex < totalEpisodes - 1) {
      handleEpisodeChange(currentEpisodeIndex + 1);
    }
  };

  // Swipe vertikal untuk navigasi episode di mobile
  useEffect(() => {
        const el = swipeContainerRef.current;
        if (!el) return;
        
        let touchStartY = 0;
        let initialPinchDistance = 0;
        let lastTapTime = 0;

        const handleTouchStart = (e: TouchEvent) => { 
            if (e.touches.length === 1) {
                touchStartY = e.touches[0].clientY; 
                // Double tap detection
                const now = Date.now();
                if (now - lastTapTime < 300) {
                    setIsZoomed(prev => !prev);
                }
                lastTapTime = now;
            } else if (e.touches.length === 2) {
                initialPinchDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && initialPinchDistance > 0) {
                const currentDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                
                if (currentDistance - initialPinchDistance > 40) {
                    setIsZoomed(true); // Pinch out (Zoom)
                    initialPinchDistance = currentDistance;
                } else if (initialPinchDistance - currentDistance > 40) {
                    setIsZoomed(false); // Pinch in (Fit)
                    initialPinchDistance = currentDistance;
                }
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (e.touches.length === 0) {
                initialPinchDistance = 0;
            }
            if (window.innerWidth >= 768 || e.changedTouches.length !== 1) return;
            
            const touchEndY = e.changedTouches[0].clientY;
            const deltaY = touchStartY - touchEndY;
            
            // Allow swipe only if the swipe is significant and no pinch was happening
            if (Math.abs(deltaY) > 80) {
                const totalEps = drama?.video_list?.length || 9999;
                if (deltaY > 80 && currentEpisodeIndex < totalEps - 1) handleEpisodeChange(currentEpisodeIndex + 1);
                else if (deltaY < -80 && currentEpisodeIndex > 0) handleEpisodeChange(currentEpisodeIndex - 1);
            }
        };

        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: true });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });
        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
        };
    }, [currentEpisodeIndex, drama]);

  // Guard: If logic fails completely and we have no data after loading
  if (!detailLoading && !drama) {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Video tidak ditemukan</h2>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Kembali
        </button>
      </main>
    )
  }

  return (
    <main className="fixed inset-0 bg-black flex flex-col">
      {/* Custom Subtitle Styling */}
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

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
        <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          <Link
            href={`/detail/melolo/${params.bookId}`}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
            <div className="flex flex-col -gap-1">
              <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md leading-none">AE PRO</span>
              <span className="text-[10px] text-white/70 hidden sm:inline leading-none">PUSAT DRAMA</span>
            </div>
          </Link>

          <div className="text-center flex-1 px-4 min-w-0">
            <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">
              {drama?.series_title || "Loading..."}
            </h1>
            <p className="text-white/80 text-xs drop-shadow-md">
              Episode {currentEpisodeIndex !== -1 ? currentEpisodeIndex + 1 : "..."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality Selector */}
            {qualities.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10 flex items-center gap-1">
                    <Settings className="w-6 h-6 drop-shadow-md" />
                    <span className="text-xs font-bold drop-shadow-md hidden sm:inline">{selectedQuality?.name || "..."}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
                  {qualities.map((q) => (
                    <DropdownMenuItem
                      key={q.name}
                      className={`cursor-pointer ${selectedQuality?.name === q.name ? "bg-white/20" : "hover:bg-white/10"}`}
                      onClick={() => setSelectedQuality(q)}
                    >
                      {q.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              onClick={() => setShowEpisodeList(!showEpisodeList)}
              className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <List className="w-6 h-6 drop-shadow-md" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div ref={swipeContainerRef} className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          {processedVideoUrl ? (
            <HlsVideoPlayer
              src={selectedQuality?.url || processedVideoUrl}
              subtitleSrc={processedSubtitleUrl}
              onEnded={handleVideoEnded}
              className={`w-full h-full max-h-[100dvh] transition-all duration-300 ${isZoomed ? "object-cover" : "object-contain"}`} controlsList="nofullscreen"
            />
          ) : !streamLoading && !streamFetching ? (
            <div className="flex flex-col items-center justify-center text-center p-4 gap-4">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <p className="text-white font-medium">URL Video tidak ditemukan</p>
              <button
                onClick={() => router.refresh()}
                className="px-6 py-2 bg-primary/20 text-primary rounded-lg font-medium hover:bg-primary/30 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : null}

          {/* Loading Overlay */}
          {(streamLoading || streamFetching || detailLoading) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-30 pointer-events-none">
              <Loader2 className="w-12 h-12 animate-spin text-primary drop-shadow-md" />
            </div>
          )}
        </div>

        <UnifiedVideoNavigation isHidden={isZoomed}
          currentEpisode={currentEpisodeIndex !== -1 ? currentEpisodeIndex + 1 : 1}
          totalEpisodes={totalEpisodes}
          onPrev={() => currentEpisodeIndex > 0 && handleEpisodeChange(currentEpisodeIndex - 1)}
          onNext={() => currentEpisodeIndex < totalEpisodes - 1 && handleEpisodeChange(currentEpisodeIndex + 1)}
        />
      </div>

      {/* Episode List Sidebar */}
      {showEpisodeList && drama && (
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
              {drama.video_list.map((video, idx) => (
                <button
                  key={video.vid}
                  onClick={() => handleEpisodeChange(idx)}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                    ${idx === currentEpisodeIndex
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function HlsVideoPlayer({
  src,
  subtitleSrc,
  onEnded,
  className,
  controlsList
}: {
  src: string;
  subtitleSrc?: string;
  onEnded?: () => void;
  className?: string;
  controlsList?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isM3U8 = (src.includes('.m3u8') || src.includes('application/vnd.apple.mpegurl') || (src.includes('proxy') && !src.includes('is_mp4=1'))) && !src.includes('.mp4') && !src.includes('mime_type=video_mp4');

    if (Hls.isSupported() && isM3U8) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log("Autoplay prevented:", e));
      });
    } else {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(e => console.log("Autoplay prevented:", e));
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  // Force activate subtitle tracks
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitleSrc) return;

    const checkSubtitle = () => {
      if (video.textTracks) {
        for (let i = 0; i < video.textTracks.length; i++) {
          if (video.textTracks[i].language === 'id' || video.textTracks[i].kind === 'subtitles') {
            video.textTracks[i].mode = 'showing';
          }
        }
      }
    };

    const timeout1 = setTimeout(checkSubtitle, 500);
    const timeout2 = setTimeout(checkSubtitle, 2000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [subtitleSrc, src]);

  return (
    <video
      ref={videoRef}
      controls
      className={className}
      onEnded={onEnded}
      autoPlay
      playsInline
      controlsList={controlsList}
    >
      {subtitleSrc && (
        <track
          label="Indonesia"
          kind="subtitles"
          srcLang="id"
          src={subtitleSrc}
          default
        />
      )}
    </video>
  );
}

