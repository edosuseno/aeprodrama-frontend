"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useDotDramaDetail, useDotDramaWatch } from "@/hooks/useDotDrama";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { ChevronLeft, Loader2, List, AlertCircle } from "lucide-react";
import Hls from "hls.js";
import { getBackendBase } from "@/lib/api-utils";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

export default function DotDramaWatchPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  // State
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [showList, setShowList] = useState(false);
  const swipeContainerRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);

  // Fetch Data
  const { data: detail, isLoading: detailLoading } = useDotDramaDetail(id || "");
  const { addToHistory } = useHistoryStore();

  const episodes = useMemo(() => detail?.episodes || [], [detail]);
  const currentEpisode = episodes[currentEpisodeIndex];

  // Fungsi pindah episode
  const goToEpisode = (idx: number) => {
    if (idx < 0 || idx >= episodes.length) return;
    setCurrentEpisodeIndex(idx);
    setShowList(false);
  };

  // Swipe vertikal (mobile gesture)
  useEffect(() => {
    const el = swipeContainerRef.current;
    if (!el) return;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth >= 768) return; 
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      // Geser ke atas (Finger moves up) -> Next Episode
      if (deltaY > 80 && currentEpisodeIndex < episodes.length - 1) {
        goToEpisode(currentEpisodeIndex + 1);
      }
      // Geser ke bawah (Finger moves down) -> Prev Episode
      else if (deltaY < -80 && currentEpisodeIndex > 0) {
        goToEpisode(currentEpisodeIndex - 1);
      }
    };
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentEpisodeIndex, episodes.length]);

  // Sync with URL ep param
  useEffect(() => {
    const ep = searchParams.get("ep");
    if (ep && episodes.length > 0) {
      const idx = episodes.findIndex(e => e.index.toString() === ep);
      if (idx !== -1) setCurrentEpisodeIndex(idx);
    }
  }, [searchParams, episodes]);

  // Fetch Stream URL
  const { data: directStreamUrl, isLoading: streamLoading } = useDotDramaWatch(id || "", currentEpisode?.index || 1);

  useEffect(() => {
    if (detail && currentEpisode) {
      const epNum = currentEpisode?.index || currentEpisodeIndex + 1;
      addToHistory({
        id: id,
        title: detail.title,
        poster: detail.cover,
        platform: "dotdrama",
        episodeNumber: epNum,
        link: `/watch/dotdrama/${id}?ep=${epNum}`
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
    // Gunakan backend base jika url relatif
    if (url.startsWith("/")) {
        processedUrl = `${getBackendBase()}${url}`;
    }

    // JANGAN gunakan double proxy jika URL sudah berasal dari vidrama.asia/api/video-proxy
    if (processedUrl.startsWith("http") && !processedUrl.includes("vidrama.asia/api/video-proxy")) {
      processedUrl = `/api/proxy?url=${encodeURIComponent(processedUrl)}&referer=${encodeURIComponent('https://vidrama.asia/')}`;
    }

    let processedSub = subUrl;
    if (processedSub && processedSub.startsWith("http")) {
      processedSub = `/api/proxy?url=${encodeURIComponent(processedSub)}&referer=${encodeURIComponent('https://vidrama.asia/')}`;
    }

    return { videoUrl: processedUrl, subtitleUrl: processedSub };
  }, [directStreamUrl, currentEpisode]);

  if (detailLoading && !detail) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Memuat Drama...</span>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black flex flex-col">
      {/* Navbar Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <Link href={`/detail/dotdrama/${id}`} className="pointer-events-auto flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10">
          <ChevronLeft className="w-6 h-6" />
          <div className="flex flex-col -gap-1">
            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md leading-none">AE PRO</span>
            <span className="text-[10px] text-white/70 hidden sm:inline leading-none uppercase tracking-tighter">Pusat Drama</span>
          </div>
        </Link>
        <div className="text-white text-center drop-shadow-md">
          <h2 className="font-bold text-sm md:text-base line-clamp-1">{detail?.title || "Dot Drama"}</h2>
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
      <div ref={(el) => { (swipeContainerRef as any).current = el; }} className="flex-1 w-full h-full flex items-center justify-center bg-black relative">
        {streamLoading ? (
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                <p className="text-white/70 text-sm">Mengambil Stream Video...</p>
            </div>
        ) : videoUrl ? (
            <VideoPlayer 
                src={videoUrl} 
                poster={detail?.cover || ""} 
                subtitleUrl={subtitleUrl}
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
                <p className="text-white/50 text-xs max-w-xs">Tautan video terhenti atau sistem memerlukan pembaruan.</p>
            </div>
        )}

        <UnifiedVideoNavigation
          currentEpisode={currentEpisodeIndex + 1}
          totalEpisodes={episodes.length}
          onPrev={() => setCurrentEpisodeIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setCurrentEpisodeIndex((prev) => Math.min(episodes.length - 1, prev + 1))}
        />
      </div>

      {/* Playlist Sidebar */}
      {showList && (
        <div className="fixed inset-y-0 right-0 z-[60] w-72 bg-gray-900/95 backdrop-blur shadow-xl border-l border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10 flex justify-between items-center text-white">
            <h3 className="font-bold">Semua Episode</h3>
            <button onClick={() => setShowList(false)}><ChevronLeft className="rotate-180" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 grid grid-cols-4 gap-2 content-start">
            {episodes.map((ep, idx) => (
              <button
                key={ep.id || idx}
                onClick={() => {
                  setCurrentEpisodeIndex(idx);
                  setShowList(false);
                }}
                className={`p-2 rounded text-sm font-medium transition ${idx === currentEpisodeIndex
                  ? "bg-cyan-600 text-white"
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

function VideoPlayer({ src, poster, subtitleUrl, onEnded }: { src: string; poster: string; subtitleUrl?: string; onEnded?: () => void }) {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
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
  }, [src, videoElement]);

  return (
    <video
      ref={setVideoElement}
      controls
      autoPlay
      className="w-full h-full object-contain"
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
