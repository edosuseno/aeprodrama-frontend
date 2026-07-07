"use client";

import { useMemo, useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { usePineDetail, usePineEpisodes, usePinePlay } from "@/hooks/usePine";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { ChevronLeft, Loader2, List, AlertCircle } from "lucide-react";
import Hls from "hls.js";
import { getBackendBase } from "@/lib/api-utils";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

import { useQueryClient } from "@tanstack/react-query";

export default function PineWatchPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-black flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>}>
      <WatchContentWrapper />
    </Suspense>
  );
}

function WatchContentWrapper() {
  const searchParams = useSearchParams();
  const { id } = useParams<{ id: string }>();
  
  const fallbackCover = searchParams.get('cover');
  const fallbackCat = searchParams.get('cat');
  let backUrl = `/detail/pine/${id}`;
  if (fallbackCover || fallbackCat) {
      const params = new URLSearchParams();
      if (fallbackCover) params.set('cover', fallbackCover);
      if (fallbackCat) params.set('cat', fallbackCat);
      backUrl += `?${params.toString()}`;
  }

  return (
    <>
      {/* Custom Subtitle Styling VIP - Ultra Force */}
      <style dangerouslySetInnerHTML={{
          __html: `
          video::cue {
              color: #ffffff !important;
              background-color: rgba(0, 0, 0, 0.75) !important;
              text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0px 2px 0 #000, 2px 0px 0 #000, 0px -2px 0 #000, -2px 0px 0 #000, 2px 2px 5px rgba(0,0,0,0.8) !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
              font-size: 24px !important;
              font-weight: 900 !important;
              line-height: 1.4 !important;
              padding: 4px 12px !important;
              border-radius: 8px !important;
          }
          
          /* Responsive subtitle size for mobile */
          @media (max-width: 768px) {
              video::cue {
                  font-size: 18px !important;
                  text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 3px rgba(0,0,0,0.9) !important;
              }
          }
          `
      }} />
      <WatchContent backUrl={backUrl} />
    </>
  );
}

function WatchContent({ backUrl }: { backUrl: string }) {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [showList, setShowList] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [nextVideoUrl, setNextVideoUrl] = useState<string | null>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);

  // Fetch Data
  const { data: detail, isLoading: detailLoading } = usePineDetail(id || "");
  const { data: episodesData, isLoading: episodesLoading } = usePineEpisodes(id || "");
  const { addToHistory } = useHistoryStore();

  const episodes = useMemo(() => episodesData || [], [episodesData]);
  const currentEpisode = episodes[currentEpisodeIndex];
  
  // Use PinePlay to get actual video url for the current episode
  const { data: playData, isLoading: playLoading } = usePinePlay(id || "", currentEpisode?.num || currentEpisode?.seqId || currentEpisodeIndex + 1);

  // Prefetch the NEXT episode to make swiping more responsive
  useEffect(() => {
    let isMounted = true;
    if (episodes.length > currentEpisodeIndex + 1) {
      const nextEpisode = episodes[currentEpisodeIndex + 1];
      const nextEpNum = nextEpisode?.num || nextEpisode?.seqId || currentEpisodeIndex + 2;
      if (id && nextEpNum) {
        queryClient.prefetchQuery({
          queryKey: ["pine", "play", id, nextEpNum],
          queryFn: async () => {
            const res = await fetch(`/api/pine/play?id=${id}&ep=${nextEpNum}`);
            const data = await res.json();
            const payload = data.data || data;
            
            // Extract the playUrl for the hidden video preloader
            if (isMounted && payload) {
               const rawUrl = payload.playUrl || payload.videoAddress;
               if (rawUrl) {
                 const proxiedUrl = rawUrl.startsWith("http") ? `/api/proxy?url=${encodeURIComponent(rawUrl)}&referer=${encodeURIComponent('https://vidrama.asia/')}` : rawUrl;
                 setNextVideoUrl(proxiedUrl);
               }
            }
            return payload;
          }
        });
      }
    } else {
       setNextVideoUrl(null);
    }
    return () => { isMounted = false; };
  }, [currentEpisodeIndex, episodes, id, queryClient]);

  // Sync with URL ep param
  useEffect(() => {
    const ep = searchParams.get("ep");
    if (ep && episodes.length > 0) {
      const idx = episodes.findIndex((e: any) => (e.num || e.seqId || e.index)?.toString() === ep);
      if (idx !== -1) setCurrentEpisodeIndex(idx);
    }
  }, [searchParams, episodes]);

  // Record History
  useEffect(() => {
    if (detail && currentEpisode) {
      const epNum = currentEpisode?.num || currentEpisode?.seqId || currentEpisodeIndex + 1;
      addToHistory({
        id: id,
        title: detail.title,
        poster: detail.cover || detail.image || "",
        platform: "pine",
        episodeNumber: epNum,
        link: `/watch/pine/${id}?ep=${epNum}`
      });
    }
  }, [id, currentEpisode, detail, addToHistory, currentEpisodeIndex]);

  const { videoUrl, subtitleUrl } = useMemo(() => {
    const url = playData?.playUrl || playData?.videoAddress || currentEpisode?.videoAddress || currentEpisode?.videoUrl;
    // Subtitles might be in an array `subtitles: [{ lang: 'id', url: '...' }]`
    const subUrl = (playData?.subtitles && playData.subtitles.length > 0) ? playData.subtitles[0].url : (playData?.subtitle || currentEpisode?.subtitle);
    
    if (!url) return { videoUrl: "", subtitleUrl: "" };
    
    let processedUrl = url;
    if (url.startsWith("http")) {
      processedUrl = `/api/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent('https://vidrama.asia/')}`;
    }

    let processedSub = subUrl || "";
    if (processedSub && processedSub.startsWith("http")) {
      processedSub = `/api/proxy?url=${encodeURIComponent(processedSub)}&referer=${encodeURIComponent('https://vidrama.asia/')}`;
    }

    return { videoUrl: processedUrl, subtitleUrl: processedSub };
  }, [playData, currentEpisode]);

  const goToEpisode = useCallback((index: number) => {
    if (index >= 0 && index < episodes.length) {
      setCurrentEpisodeIndex(index);
      const epNum = episodes[index].num || episodes[index].seqId || episodes[index].index || index + 1;
      const params = new URLSearchParams(searchParams.toString());
      params.set("ep", epNum.toString());
      router.replace(`/watch/pine/${id}?${params.toString()}`, { scroll: false });
    }
  }, [episodes, id, router, searchParams]);

  // Scroll/Swipe Navigation
  useEffect(() => {
    const el = swipeContainerRef.current;
    if (!el) return;

    let touchStartY = 0;
    let initialPinchDistance = 0;
    let lastTapTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
            touchStartY = e.touches[0].clientY;
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
                setIsZoomed(true); // Pinch out
                initialPinchDistance = currentDistance;
            } else if (initialPinchDistance - currentDistance > 40) {
                setIsZoomed(false); // Pinch in
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
        const threshold = 70;
        
        if (Math.abs(deltaY) > threshold) {
            if (deltaY > 0 && currentEpisodeIndex < episodes.length - 1) {
                goToEpisode(currentEpisodeIndex + 1);
            } else if (deltaY < 0 && currentEpisodeIndex > 0) {
                goToEpisode(currentEpisodeIndex - 1);
            }
        }
    };

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 800) return;

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
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [currentEpisodeIndex, episodes.length, goToEpisode]);

  if ((detailLoading || episodesLoading) && (!detail || !episodes.length)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="ml-2 font-display">Pine...</span>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black flex flex-col overflow-hidden">
      {/* Navbar Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <Link href={backUrl} className="pointer-events-auto flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10">
          <ChevronLeft className="w-6 h-6" />
          <div className="flex flex-col -gap-1">
            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md leading-none">DRACINDO</span>
            <span className="text-[10px] text-white/70 hidden sm:inline leading-none uppercase tracking-tighter">Pusat Drama</span>
          </div>
        </Link>
        <div className="text-white text-center drop-shadow-md px-4 min-w-0">
          <h2 className="font-bold text-sm md:text-base line-clamp-1">{detail?.title || "Pine"}</h2>
          <p className="text-xs opacity-80 uppercase tracking-widest font-medium">
            Episode {currentEpisode?.index || currentEpisodeIndex + 1} / {detail?.totalEpisodes || episodes.length}
          </p>
        </div>
        <button
          onClick={() => setShowList(prev => !prev)}
          className="pointer-events-auto p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition border border-white/10"
        >
          <List className="w-6 h-6" />
        </button>
      </div>

      {/* Video Player */}
      <div 
        ref={swipeContainerRef} 
        className="flex-1 w-full h-full flex items-center justify-center bg-black relative touch-none"
      >
        {playLoading ? (
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-white/70 text-sm font-medium animate-pulse">Memuat Episode...</p>
            </div>
        ) : !videoUrl ? (
            <div className="flex flex-col items-center gap-4 text-center px-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-white font-medium">Stream Tidak Tersedia</p>
                <p className="text-white/50 text-xs max-w-xs">Pastikan Anda memiliki koneksi internet yang stabil untuk mengakses konten Pine.</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 rounded-full text-white text-sm">Coba Lagi</button>
            </div>
        ) : (
            <VideoPlayer 
                src={videoUrl} 
                poster={detail?.cover || detail?.image || ""} 
                subtitleUrl={subtitleUrl}
                isZoomed={isZoomed}
                onEnded={() => {
                    if (currentEpisodeIndex < episodes.length - 1) {
                        goToEpisode(currentEpisodeIndex + 1);
                    }
                }}
            />
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
            <h3 className="font-bold">Playlet Episodes</h3>
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
                className={`aspect-square flex items-center justify-center rounded text-sm font-bold transition shadow-sm ${idx === currentEpisodeIndex
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Preloader for the Next Episode */}
      {nextVideoUrl && (
        <>
          {/* Preload manifest untuk iOS / Safari */}
          <link rel="preload" href={nextVideoUrl} as="fetch" />
          {/* Preload video buffer untuk Android / Desktop */}
          <video 
             preload="auto" 
             src={nextVideoUrl} 
             className="hidden" 
             muted
             playsInline
          />
        </>
      )}
    </div>
  );
}

function VideoPlayer({ src, poster, subtitleUrl, isZoomed, onEnded }: { src: string; poster: string; subtitleUrl?: string; isZoomed?: boolean; onEnded?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const isHls = src.includes('.m3u8') || src.includes('.m3u');
    let hls: Hls | null = null;

    if (Hls.isSupported() && isHls) {
      hls = new Hls({
        enableWorker: false, // More stable for VOD in local dev
        backBufferLength: 60 * 1.5,
        fragLoadingMaxRetry: 5,
        manifestLoadingMaxRetry: 5,
        levelLoadingMaxRetry: 5,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("HLS Network Error, retrying...");
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("HLS Media Error, recovering...");
              hls?.recoverMediaError();
              break;
            default:
              console.log("HLS Fatal Error, destroying...");
              hls?.destroy();
              break;
          }
        }
      });
    } else {
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      autoPlay
      controls
      className={`w-full h-full max-h-[100dvh] transition-all duration-300 ${isZoomed ? "object-cover" : "object-contain"}`}
      controlsList="nofullscreen"
      poster={poster}
      onEnded={onEnded}
      playsInline
    />
  );
}
