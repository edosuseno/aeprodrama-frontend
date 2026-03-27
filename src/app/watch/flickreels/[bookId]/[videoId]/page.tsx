"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFlickReelsDetail } from "@/hooks/useFlickReels";
import { ChevronLeft, ChevronRight, Loader2, List, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

export default function FlickReelsWatchPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const initialVideoId = params.videoId as string;

  // Use separate state for active ID to allow instant UI updates
  const [activeVideoId, setActiveVideoId] = useState(initialVideoId);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [warmupError, setWarmupError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Stable timestamp that only changes with episode or retry
  const videoTimestamp = useRef(Date.now());
  // Track if this is initial load (should wait for warmup) vs auto-next (should be seamless)
  const isInitialLoad = useRef(true);

  // Ref untuk area swipe vertikal (mobile)
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, refetch } = useFlickReelsDetail(bookId);

  // Sync state if URL param changes (e.g. back button)
  useEffect(() => {
    if (params.videoId && params.videoId !== activeVideoId) {
      setActiveVideoId(params.videoId as string);
      setRetryCount(0);
      setVideoReady(false);
      setWarmupError(false);
    }
  }, [params.videoId]);

  // Derived state
  const episodes = useMemo(() => data?.episodes || [], [data]);

  const currentIndex = useMemo(() => {
    return episodes.findIndex((ep) => ep.id === activeVideoId);
  }, [episodes, activeVideoId]);

  const currentEpisodeData = useMemo(() => {
    if (currentIndex === -1) return null;
    return episodes[currentIndex];
  }, [episodes, currentIndex]);

  const totalEpisodes = episodes.length;

  // Update video src - combines warmup and src update
  // Set src langsung tanpa menunggu warmup, warmup hanya di background
  useEffect(() => {
    if (!currentEpisodeData?.raw?.videoUrl) return;

    // Update timestamp when video changes
    videoTimestamp.current = Date.now();

    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const videoUrl = currentEpisodeData.raw.videoUrl;
    const newSrc = `${backendBase}/api/proxy?url=${encodeURIComponent(videoUrl)}&referer=${encodeURIComponent("https://www.flickreels.com/")}&_t=${videoTimestamp.current}`;
    const warmupUrl = `${backendBase}/api/proxy?url=${encodeURIComponent(videoUrl)}&warmup=1`;

    // Langsung set video src tanpa menunggu warmup
    setVideoReady(true);
    setWarmupError(false);

    if (videoRef.current) {
      videoRef.current.src = newSrc;
      videoRef.current.load();
      videoRef.current.play().catch(() => { });
    }

    // Fire warmup in background (untuk pre-cache di server)
    fetch(warmupUrl)
      .then(res => res.json())
      .then(data => {
        console.log("[Warmup] Background:", data.success ? "success" : "failed");
        if (!data.success) setWarmupError(true);
      })
      .catch(() => { });

    // Mark initial load as done
    isInitialLoad.current = false;
  }, [currentEpisodeData?.raw?.videoUrl, retryCount]);

  // Note: useEffect untuk set video src setelah warmup tidak lagi dibutuhkan
  // karena src langsung di-set di atas

  // Handlers
  const handleEpisodeChange = (episodeId: string, preserveFullscreen = false) => {
    setActiveVideoId(episodeId);
    setRetryCount(0); // Reset retry count when changing episodes
    setShowEpisodeList(false);

    if (preserveFullscreen) {
      window.history.replaceState(null, "", `/watch/flickreels/${bookId}/${episodeId}`);
    } else {
      router.push(`/watch/flickreels/${bookId}/${episodeId}`);
    }
  };

  const handleVideoEnded = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < totalEpisodes) {
      // Video element stays mounted, so fullscreen is preserved automatically
      handleEpisodeChange(episodes[nextIndex].id, true);
    }
  };



  // Swipe vertikal untuk navigasi episode di mobile
  useEffect(() => {
    const el = swipeContainerRef.current;
    if (!el) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Hanya aktif di mobile
      if (window.innerWidth >= 768) return;

      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;

      // Threshold 80px agar tidak konflik dengan tap kontrol video
      if (deltaY > 80) {
        // Swipe ke atas → episode berikutnya
        const nextEp = episodes[currentIndex + 1];
        if (nextEp) handleEpisodeChange(nextEp.id, true);
      } else if (deltaY < -80) {
        // Swipe ke bawah → episode sebelumnya
        const prevEp = episodes[currentIndex - 1];
        if (prevEp) handleEpisodeChange(prevEp.id, true);
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, episodes, handleEpisodeChange]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h3 className="text-white font-medium text-lg">Memuat video...</h3>
          <p className="text-white/60 text-sm">Mohon tunggu sebentar, data sedang diambil.</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Drama tidak ditemukan</h2>
        <Link href="/" className="text-primary hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  const { drama } = data;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header - Fixed Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />

        <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          <Link
            href={`/detail/flickreels/${bookId}`}
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
              {drama.title}
            </h1>
            <p className="text-white/80 text-xs drop-shadow-md">
              {currentEpisodeData ? `Episode ${currentEpisodeData.index + 1}` : "Episode ?"}
            </p>
          </div>

          <button
            onClick={() => setShowEpisodeList(!showEpisodeList)}
            className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <List className="w-6 h-6 drop-shadow-md" />
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div ref={swipeContainerRef} className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Always render video element to preserve fullscreen state */}
          <video
            ref={videoRef}
            controls
            autoPlay
            className={cn(
              "w-full h-full object-contain max-h-[100dvh]",
              (!currentEpisodeData || !videoReady) && "invisible"
            )}
            poster={currentEpisodeData?.raw?.chapter_cover 
              ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/image-proxy?url=${encodeURIComponent(currentEpisodeData.raw.chapter_cover)}` 
              : undefined}
            onEnded={handleVideoEnded}
            onError={async (e) => {
              if (retryCount < 2) {
                // Proxy failed - token probably expired, refetch fresh URLs
                console.log("Video load failed, refetching fresh data...");
                setRetryCount(prev => prev + 1);
                await refetch();
              }
            }}
            // @ts-ignore
            referrerPolicy="no-referrer"
          />
          {/* Loading overlay */}
          {(!currentEpisodeData || !videoReady) && (
            <div className="absolute inset-0 flex items-center justify-center z-20 flex-col gap-2">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              {!videoReady && currentEpisodeData && (
                <span className="text-white/60 text-sm">Preparing video...</span>
              )}
            </div>
          )}
        </div>

        {/* Navigation Controls Overlay - Bottom */}
        <UnifiedVideoNavigation
          currentEpisode={currentEpisodeData ? currentEpisodeData.index + 1 : 1}
          totalEpisodes={totalEpisodes}
          onPrev={() => {
            const prev = episodes[currentIndex - 1];
            if (prev) handleEpisodeChange(prev.id);
          }}
          onNext={() => {
            const next = episodes[currentIndex + 1];
            if (next) handleEpisodeChange(next.id);
          }}
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
              {episodes.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => handleEpisodeChange(ep.id)}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all",
                    ep.id === activeVideoId
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {ep.index + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
