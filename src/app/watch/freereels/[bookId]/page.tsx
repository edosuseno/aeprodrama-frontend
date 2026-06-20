"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useFreeReelsDetail } from "@/hooks/useFreeReels";
import { ChevronLeft, ChevronRight, Loader2, List, AlertCircle } from "lucide-react";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Hls from "hls.js";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

// Removed manual VTT parser as native track is styled with video::cue

export default function FreeReelsWatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  // State synced with URL search param 'ep'
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'h264' | 'h265'>('h264');
  const [useProxy, setUseProxy] = useState(true); // FIX: Always proxy for FreeReels to bypass CORS

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);



  // Ref untuk area swipe vertikal (mobile)
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useFreeReelsDetail(bookId);
  const { addToHistory } = useHistoryStore();

  // Sync state from URL params
  useEffect(() => {
    const epParam = searchParams.get("ep");
    if (epParam) {
      const epIndex = parseInt(epParam, 10) - 1; // URL is 1-based, internal is 0-based
      if (!isNaN(epIndex) && epIndex >= 0) {
        setCurrentEpisodeIndex(epIndex);
        // setUseProxy(false); // REMOVED: Keep proxy active
      }
    }
  }, [searchParams]);

  // Derived state
  const drama = data?.data;
  const episodes = useMemo(() => drama?.episodes || [], [drama]);
  const totalEpisodes = episodes.length;

  const currentEpisodeData = useMemo(() => {
    return episodes[currentEpisodeIndex] || episodes[0] || null;
  }, [episodes, currentEpisodeIndex]);

  // Catat ke History
  useEffect(() => {
    if (drama && bookId && currentEpisodeData) {
      addToHistory({
        id: bookId,
        title: drama.title,
        poster: drama.cover,
        platform: "FreeReels",
        episodeNumber: (currentEpisodeData.index || currentEpisodeIndex) + 1,
        link: `/watch/freereels/${bookId}?ep=${(currentEpisodeData.index || currentEpisodeIndex) + 1}`
      });
    }
  }, [bookId, currentEpisodeIndex, drama, currentEpisodeData, addToHistory]);

  // Determine current video URL based on quality selection
  const currentVideoUrl = useMemo(() => {
    if (!currentEpisodeData) return "";
    let sourceUrl = "";
    if (videoQuality === 'h265' && currentEpisodeData.external_audio_h265_m3u8) {
      sourceUrl = currentEpisodeData.external_audio_h265_m3u8;
    } else {
      sourceUrl = currentEpisodeData.external_audio_h264_m3u8 || currentEpisodeData.videoUrl || "";
    }

    // We will inject the subtitle URL into the video proxy call if available
    // This allows the proxy to rewrite the manifest to include the subtitle intrinsically
    if (currentEpisodeData.subtitleUrl && currentEpisodeData.originalAudioLanguage !== 'id-ID') {
      // We use a special convention: append &sub=... to the proxy URL
      // But here we return the raw source. The proxy wrapping happens in the effect.
      return sourceUrl;
    }

    return sourceUrl;
  }, [currentEpisodeData, videoQuality]);

  const proxiedSubtitleUrl = useMemo(() => {
    if (!currentEpisodeData?.subtitleUrl) return "";
    const proxyBaseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
    return `${proxyBaseUrl}/api/proxy?url=${encodeURIComponent(currentEpisodeData.subtitleUrl)}`;
  }, [currentEpisodeData]);

  // Load video with HLS support
  useEffect(() => {
    // Don't auto-load if not available (wait for user interaction or initial load)
    if (!currentVideoUrl) return;

    // Smart fallback logic: Try direct first, then proxy
    // Check if we need to inject subtitle via proxy
    const subParam = "";
    // (currentEpisodeData?.subtitleUrl && currentEpisodeData?.originalAudioLanguage !== 'id-ID') 
    // ? `&sub=${encodeURIComponent(currentEpisodeData.subtitleUrl)}`
    // : "";

    const isHlsUrl = currentVideoUrl.includes('.m3u8') || currentVideoUrl.includes('.m3u');
    const proxyBaseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
    const videoUrl = (useProxy && isHlsUrl)
      ? `${proxyBaseUrl}/api/proxy?url=${encodeURIComponent(currentVideoUrl)}${subParam}`
      : currentVideoUrl;

    const video = videoRef.current;
    if (!video) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // If we are using proxy or it's an m3u8 file, try HLS
    if (Hls.isSupported() && (videoUrl.includes('.m3u8') || useProxy)) {
      console.log(`Loading video: ${useProxy ? 'Proxy' : 'Direct'} from ${videoUrl}`);
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false, // Usage of Low Latency is aggressive
        maxBufferLength: 10, // Only buffer 10s ahead
        maxMaxBufferLength: 20,
        backBufferLength: 10,
        xhrSetup: function (xhr) {
          xhr.withCredentials = false;
        },
        // Reduce spamming on error
        manifestLoadingRetryDelay: 2000,
        manifestLoadingMaxRetry: 3,
        fragLoadingRetryDelay: 2000,
        fragLoadingMaxRetry: 3,
        levelLoadingMaxRetry: 3,
      });

      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => console.log('Autoplay prevented'));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.log("HLS Fatal Error:", data.type);
          hls.destroy();
          if (!useProxy) {
            console.log("Direct play failed, switching to proxy...");
            setUseProxy(true);
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = videoUrl;
      video.play().catch(() => { });
    } else {
      // Direct play (MP4 etc)
      video.src = videoUrl;
      video.play().catch(() => { });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [currentVideoUrl, useProxy]);


  // Manual Subtitle Injection & Enforcement (Hybrid: native track + CSS overlay)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Hanya gunakan Native <track> injection

    const enforce = () => {
      if (!video) return;
      const tracks = Array.from(video.textTracks);
      const indo = tracks.find(t => t.label === 'Indonesia' || t.language === 'id');
      if (indo && indo.mode !== 'showing') {
        indo.mode = 'showing';
      }
    };
    const timeout1 = setTimeout(enforce, 500);
    const interval = setInterval(enforce, 3000);

    return () => {
      clearTimeout(timeout1);
      clearInterval(interval);
    };
  }, [proxiedSubtitleUrl]);

  // Navigation Handler
  const handleEpisodeChange = (index: number) => {
    if (index === currentEpisodeIndex) return;

    // Updates URL, which triggers the useEffect above
    const nextEp = index + 1;
    setShowEpisodeList(false);

    // Use replace for smoother history, or push? Usually push for navigation.
    // Netshort uses replace for next episode, but buttons usually push.
    // Let's use push to allow back button to work.
    // Verify data in console
    console.log("Current Ep Data:", currentEpisodeData);
    console.log("Proxied Subtitle URL:", proxiedSubtitleUrl);
    console.log("Original Audio:", currentEpisodeData?.originalAudioLanguage);

    router.push(`/watch/freereels/${bookId}?ep=${nextEp}`);
  };

  const handleVideoEnded = () => {
    const nextIndex = currentEpisodeIndex + 1;
    if (nextIndex < totalEpisodes) {
      // Auto-advance
      const nextEp = nextIndex + 1;
      router.replace(`/watch/freereels/${bookId}?ep=${nextEp}`); // Replace for auto-advance
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
        if (currentEpisodeIndex < totalEpisodes - 1) handleEpisodeChange(currentEpisodeIndex + 1);
      } else if (deltaY < -80) {
        // Swipe ke bawah → episode sebelumnya
        if (currentEpisodeIndex > 0) handleEpisodeChange(currentEpisodeIndex - 1);
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentEpisodeIndex, totalEpisodes, handleEpisodeChange]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h3 className="text-white font-medium text-lg">Memuat video...</h3>
          <p className="text-white/60 text-sm">Mohon tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  if (error || !drama) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Video tidak ditemukan</h2>
        <Link href="/" className="text-primary hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Custom Subtitle Styling VIP - Seragam Velolo */}
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
      {/* Header - Fixed Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />

        <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          <Link
            href={`/detail/freereels/${bookId}`}
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
              {currentEpisodeData ? `Episode ${(currentEpisodeData.index || currentEpisodeIndex) + 1}` : "Episode ?"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality Selector */}
            <div className="flex bg-black/40 backdrop-blur-sm rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setVideoQuality('h264')}
                className={cn(
                  "text-[10px] px-2 py-1 rounded-md transition-all font-medium",
                  videoQuality === 'h264' ? "bg-primary text-white" : "text-white/70 hover:text-white"
                )}
              >
                H.264
              </button>
              <button
                onClick={() => setVideoQuality('h265')}
                className={cn(
                  "text-[10px] px-2 py-1 rounded-md transition-all font-medium",
                  videoQuality === 'h265' ? "bg-primary text-white" : "text-white/70 hover:text-white"
                )}
              >
                H.265
              </button>
            </div>

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
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            webkit-playsinline="true"
            className={cn(
              "w-full h-full object-contain max-h-[100dvh]",
              !currentVideoUrl && "invisible"
            )}
            poster={drama.cover}
            onEnded={handleVideoEnded}
            {...({ disableRemotePlayback: true, referrerPolicy: "no-referrer" } as any)}
          >
            {proxiedSubtitleUrl && (
              <track
                key={proxiedSubtitleUrl}
                label="Indonesia"
                kind="subtitles"
                srcLang="id"
                src={proxiedSubtitleUrl}
                default
              />
            )}
          </video>

          {!currentVideoUrl && (
            <div className="absolute inset-0 flex items-center justify-center z-20 flex-col gap-4">
              <p className="text-white/60">Memuat Video...</p>
            </div>
          )}


        </div>

        {/* Navigation Controls Overlay - Bottom */}
        <UnifiedVideoNavigation
          currentEpisode={currentEpisodeData ? (currentEpisodeData.index || currentEpisodeIndex) + 1 : 1}
          totalEpisodes={totalEpisodes}
          onPrev={() => handleEpisodeChange(currentEpisodeIndex - 1)}
          onNext={() => handleEpisodeChange(currentEpisodeIndex + 1)}
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
              {episodes.map((ep: any, idx: number) => (
                <button
                  key={ep.id}
                  onClick={() => handleEpisodeChange(idx)}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all",
                    idx === currentEpisodeIndex
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {(ep.index || idx) + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
