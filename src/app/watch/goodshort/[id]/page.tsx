"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useGoodShortDetail, useGoodShortWatch } from "@/hooks/useGoodShort";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { ChevronLeft, Loader2, List, AlertCircle } from "lucide-react";
import Hls from "hls.js";
import { getBackendBase } from "@/lib/api-utils";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

export default function GoodShortWatchPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [showList, setShowList] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);

  // Fetch Data
  const { data: detail, isLoading: detailLoading } = useGoodShortDetail(id || "");
  const { addToHistory } = useHistoryStore();

  const episodes = useMemo(() => detail?.episodes || [], [detail]);
  const currentEpisode = episodes[currentEpisodeIndex];

  // Sync with URL ep param
  useEffect(() => {
    const ep = searchParams.get("ep");
    if (ep && episodes.length > 0) {
      const idx = episodes.findIndex((e: any) => e.index.toString() === ep);
      if (idx !== -1) setCurrentEpisodeIndex(idx);
    }
  }, [searchParams, episodes]);

  // Fetch Stream URL
  const { data: directStreamUrl, isLoading: streamLoading } = useGoodShortWatch(id || "", currentEpisode?.index || 1);

  useEffect(() => {
    if (detail && currentEpisode) {
      const epNum = currentEpisode?.index || currentEpisodeIndex + 1;
      addToHistory({
        id: id,
        title: detail.title,
        poster: detail.cover,
        platform: "goodshort",
        episodeNumber: epNum,
        link: `/watch/goodshort/${id}?ep=${epNum}`
      });
    }
  }, [id, currentEpisode, detail, addToHistory, currentEpisodeIndex]);

  // Video URL & Subtitle handling
  const { videoUrl, subtitleUrl } = useMemo(() => {
    // Check if directStreamUrl is an object { url, subtitle }
    const streamObj = typeof directStreamUrl === 'object' && directStreamUrl !== null ? (directStreamUrl as any) : null;
    const url = streamObj?.url || (typeof directStreamUrl === 'string' ? directStreamUrl : null) || currentEpisode?.videoAddress;
    const subUrl = streamObj?.subtitle || (currentEpisode as any)?.subtitle || "";

    if (!url) return { videoUrl: "", subtitleUrl: "" };
    
    let processedUrl = url;
    // Jika URL sudah di-proxy oleh backend (mengandung /api/proxy atau /api/goodshort/proxy),
    // jangan proses ulang — langsung gunakan
    // Jika URL masih raw (belum di-proxy), proses melalui backend proxy
    if (processedUrl.startsWith("http") && !processedUrl.includes("/api/proxy") && !processedUrl.includes("/api/goodshort/proxy") && !processedUrl.includes("vidrama.asia/api/video-proxy")) {
      processedUrl = `/api/proxy?url=${encodeURIComponent(processedUrl)}&referer=${encodeURIComponent('https://vidrama.asia/')}`;
    }

    let processedSub = subUrl;
    if (processedSub && processedSub.startsWith("http") && !processedSub.includes("/api/proxy")) {
      processedSub = `/api/proxy?url=${encodeURIComponent(processedSub)}&referer=${encodeURIComponent('https://vidrama.asia/')}`;
    }

    return { videoUrl: processedUrl, subtitleUrl: processedSub };
  }, [directStreamUrl, currentEpisode]);

  const goToEpisode = useCallback((index: number) => {
    if (index >= 0 && index < episodes.length) {
      setCurrentEpisodeIndex(index);
      const epNum = episodes[index].index;
      router.replace(`/watch/goodshort/${id}?ep=${epNum}`, { scroll: false });
    }
  }, [episodes, id, router]);

  // Scroll/Swipe Navigation
  useEffect(() => {
    const el = swipeContainerRef.current;
    if (!el) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      const threshold = 70;

      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0 && currentEpisodeIndex < episodes.length - 1) {
          // Swipe Up -> Next Episode
          goToEpisode(currentEpisodeIndex + 1);
        } else if (deltaY < 0 && currentEpisodeIndex > 0) {
          // Swipe Down -> Prev Episode
          goToEpisode(currentEpisodeIndex - 1);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 800) return; // Debounce scroll

      if (Math.abs(e.deltaY) > 50) {
        if (e.deltaY > 0 && currentEpisodeIndex < episodes.length - 1) {
          goToEpisode(currentEpisodeIndex + 1);
          lastScrollTime.current = now;
        } else if (e.deltaY < 0 && currentEpisodeIndex > 0) {
          goToEpisode(currentEpisodeIndex - 1);
          lastScrollTime.current = now;
        }
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [currentEpisodeIndex, episodes.length, goToEpisode]);

  if (detailLoading && !detail) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="ml-2">Memuat Drama...</span>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black flex flex-col">
      {/* Navbar Overlay */}
      {/* Custom Subtitle Styling VIP - Anti Black Box */}
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
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <Link href={`/detail/goodshort/${id}`} className="pointer-events-auto flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10">
          <ChevronLeft className="w-6 h-6" />
          <div className="flex flex-col -gap-1">
            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md leading-none">DRACINDO</span>
            <span className="text-[10px] text-white/70 hidden sm:inline leading-none uppercase tracking-tighter">Pusat Drama</span>
          </div>
        </Link>
        <div className="text-white text-center drop-shadow-md px-4 min-w-0">
          <h2 className="font-bold text-sm md:text-base line-clamp-1">{detail?.title || "GoodShort"}</h2>
          <p className="text-xs opacity-80">
            Episode {currentEpisode?.index || currentEpisodeIndex + 1} / {detail?.totalEpisodes || episodes.length}
          </p>
        </div>
        <button
          onClick={() => setShowList(prev => !prev)}
          className="pointer-events-auto p-2 bg-black/20 backdrop-blur rounded-full text-white hover:bg-white/20 transition"
        >
          <List className="w-6 h-6" />
        </button>
      </div>

      {/* Video Player */}
      <div 
        ref={swipeContainerRef} 
        className="flex-1 w-full h-full flex items-center justify-center bg-black relative touch-none"
      >
        {(streamLoading || detailLoading) ? (
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
                <p className="text-white/70 text-sm">Mengambil Stream Video...</p>
            </div>
        ) : videoUrl ? (
            <VideoPlayer 
                src={videoUrl} 
                poster={detail?.cover || ""} 
                subtitleUrl={subtitleUrl}
                isZoomed={isZoomed}
                onEnded={() => {
                    if (currentEpisodeIndex < episodes.length - 1) {
                        setCurrentEpisodeIndex(prev => prev + 1);
                    }
                }}
            />
        ) : (
            <div className="flex flex-col items-center gap-4 text-center px-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-white font-medium">Video Gagal Dimuat</p>
                <p className="text-white/50 text-xs max-w-xs">Tautan video mungkin sudah kedaluwarsa atau memerlukan peningkatan sistem.</p>
            </div>
        )}

        <UnifiedVideoNavigation isHidden={isZoomed}
          currentEpisode={currentEpisodeIndex + 1}
          totalEpisodes={episodes.length}
          onPrev={() => goToEpisode(currentEpisodeIndex - 1)}
          onNext={() => goToEpisode(currentEpisodeIndex + 1)}
        />
      </div>

      {/* Playlist Sidebar */}
      {showList && (
        <div className="fixed inset-y-0 right-0 z-[60] w-72 bg-gray-900/95 backdrop-blur shadow-xl border-l border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10 flex justify-between items-center text-white">
            <h3 className="font-bold">Semua Episode</h3>
            <button onClick={() => setShowList(false)} className="p-1 hover:bg-white/10 rounded-full transition">
              <ChevronLeft className="rotate-180 w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 gap-2 content-start">
            {episodes.map((ep: any, idx: number) => (
              <button
                key={ep.id || idx}
                onClick={() => {
                  goToEpisode(idx);
                  setShowList(false);
                }}
                className={`aspect-square flex items-center justify-center rounded text-sm font-medium transition ${idx === currentEpisodeIndex
                  ? "bg-rose-600 text-white"
                  : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
              >
                {ep.index}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VideoPlayer({ src, poster, subtitleUrl, isZoomed, onEnded }: { src: string; poster: string; subtitleUrl?: string; isZoomed?: boolean; onEnded?: () => void }) {
  const videoElementRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoElementRef.current;
    if (!videoElement || !src) return;

    const isHls = src.includes('.m3u8') || src.includes('.m3u');
    let hls: Hls | null = null;

    if (Hls.isSupported() && isHls) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60 * 1.5,
      });
      hls.loadSource(src);
      hls.attachMedia(videoElement);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoElement.play().catch(() => {});
      });
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              break;
          }
        }
      });
    } else {
      videoElement.src = src;
      videoElement.play().catch(() => {});
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoElementRef}
      controls
      autoPlay
      className={`w-full h-full max-h-[100dvh] transition-all duration-300 ${isZoomed ? "object-cover" : "object-contain"}`}
      controlsList="nofullscreen"
      poster={poster}
      onEnded={onEnded}
      playsInline
    >
        {subtitleUrl && (
            <track 
                kind="subtitles" 
                src={subtitleUrl} 
                srcLang="id" 
                label="Bahasa Indonesia" 
                default 
            />
        )}
    </video>
  );
}
