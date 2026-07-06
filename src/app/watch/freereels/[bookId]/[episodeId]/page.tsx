"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFreeReelsDetail } from "@/hooks/useFreeReels";
import { ChevronLeft, ChevronRight, Loader2, List, AlertCircle } from "lucide-react";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Hls from "hls.js";

// --- VTT Parser & CSS Subtitle Overlay ---
interface VttCue {
  start: number;
  end: number;
  text: string;
}

function parseVttTime(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length === 3) return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  return 0;
}

function parseVtt(vttText: string): VttCue[] {
  const cues: VttCue[] = [];
  let text = vttText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  const blocks = text.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    let timeLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) { timeLine = i; break; }
    }
    if (timeLine === -1) continue;
    const [startStr, endStr] = lines[timeLine].split('-->').map(s => s.trim().split(' ')[0]);
    const textLines = lines.slice(timeLine + 1).join('\n').trim();
    if (startStr && endStr && textLines) {
      cues.push({
        start: parseVttTime(startStr),
        end: parseVttTime(endStr),
        text: textLines.replace(/<[^>]*>/g, ''),
      });
    }
  }
  return cues;
}

export default function FreeReelsWatchPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  // Use params directly as source of truth
  const activeEpisodeId = params.episodeId as string;

  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'h264' | 'h265'>('h264');
  const [useProxy, setUseProxy] = useState(true); // Wajib true di VPS untuk bypass CORS dari CDN mydramawave
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // State untuk CSS-based subtitle overlay
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>("");
  const vttCuesRef = useRef<VttCue[]>([]);
  const subtitleAnimFrameRef = useRef<number>(0);

  // Ref untuk area swipe vertikal (mobile)
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useFreeReelsDetail(bookId);

  const { addToHistory } = useHistoryStore();

  // Derived state
  const drama = data?.data;
  const episodes = useMemo(() => drama?.episodes || [], [drama]);

  const currentIndex = useMemo(() => {
    return episodes.findIndex((ep: any) => ep.id === activeEpisodeId);
  }, [episodes, activeEpisodeId]);

  const currentEpisodeData = useMemo(() => {
    if (currentIndex === -1) return episodes[0] || null;
    return episodes[currentIndex];
  }, [episodes, currentIndex]);

  const totalEpisodes = episodes.length;

  // Catat ke History
  useEffect(() => {
    if (drama && bookId && currentEpisodeData) {
      addToHistory({
        id: bookId,
        title: drama.title,
        poster: drama.cover,
        platform: "FreeReels",
        episodeNumber: (currentEpisodeData.index || 0) + 1,
        link: `/watch/freereels/${bookId}/${activeEpisodeId}`
      });
    }
  }, [bookId, activeEpisodeId, drama, currentEpisodeData, addToHistory]);

  // Determine current video URL based on quality selection
  const currentVideoUrl = useMemo(() => {
    if (!currentEpisodeData) return "";
    if (videoQuality === 'h265' && currentEpisodeData.external_audio_h265_m3u8) {
      return currentEpisodeData.external_audio_h265_m3u8;
    }
    return currentEpisodeData.external_audio_h264_m3u8 || currentEpisodeData.videoUrl || "";
  }, [currentEpisodeData, videoQuality]);

  const proxiedSubtitleUrl = useMemo(() => {
    if (!currentEpisodeData?.subtitleUrl) return "";
    const proxyBaseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
    return `${proxyBaseUrl}/api/proxy?url=${encodeURIComponent(currentEpisodeData.subtitleUrl)}`;
  }, [currentEpisodeData]);

  // Handlers
  const handleEpisodeChange = (episodeId: string, preserveFullscreen = false) => {
    if (episodeId === activeEpisodeId) return;

    // Only reset transient UI states
    setShowEpisodeList(false);

    // Update URL - this will trigger re-render with new params
    if (preserveFullscreen) {
      window.history.replaceState(null, "", `/watch/freereels/${bookId}/${episodeId}`);
    } else {
      router.push(`/watch/freereels/${bookId}/${episodeId}`);
    }
  };

  const handleVideoEnded = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < totalEpisodes) {
      handleEpisodeChange(episodes[nextIndex].id, true);
    }
  };

  // Handle HLS.js Video Loading
  useEffect(() => {
    const videoUrlRaw = currentVideoUrl;
    if (videoUrlRaw && videoRef.current) {
      const video = videoRef.current;
      const proxyBaseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
      const videoUrl = useProxy ? `${proxyBaseUrl}/api/proxy?url=${encodeURIComponent(videoUrlRaw)}` : videoUrlRaw;

      // Clean up previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const isHlsUrl = videoUrl.includes('.m3u8') || videoUrl.includes('application/x-mpegURL');

      // Priority 1: HLS.js for .m3u8 (if supported)
      if (isHlsUrl && Hls.isSupported()) {
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          xhrSetup: function (xhr, url) {
            xhr.withCredentials = false;
          },
        });
        hlsRef.current = hls;

        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((e) => console.log(`Auto-play failed: ${e.message}`));
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          const errorMsg = `HLS Error: ${data.type} - ${data.details}`;
          console.error(errorMsg);

          if (data.fatal) {
            hls.destroy();
          }
        });
      }
      // Priority 2: Native playback (MP4 or Native HLS on Safari)
      else {
        video.src = videoUrl;
        video.load(); // Ensure source update

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            console.log(`Native play failed: ${e.message}`);
          });
        }
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentVideoUrl, useProxy]);

  // Manual Subtitle Injection & Enforcement (Hybrid: native track + CSS overlay)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentSubtitleText("");
    vttCuesRef.current = [];
    if (subtitleAnimFrameRef.current) {
      cancelAnimationFrame(subtitleAnimFrameRef.current);
      subtitleAnimFrameRef.current = 0;
    }

    if (!proxiedSubtitleUrl) return;

    // --- STRATEGI 1: CSS Overlay ---
    const fetchAndParseSubtitle = async () => {
      try {
        const res = await fetch(proxiedSubtitleUrl);
        if (!res.ok) return;
        const text = await res.text();
        vttCuesRef.current = parseVtt(text);

        const syncLoop = () => {
          if (!videoRef.current || vttCuesRef.current.length === 0) return;
          const currentTime = videoRef.current.currentTime;
          const activeCue = vttCuesRef.current.find(
            c => currentTime >= c.start && currentTime <= c.end
          );
          setCurrentSubtitleText(activeCue?.text || "");
          subtitleAnimFrameRef.current = requestAnimationFrame(syncLoop);
        };
        subtitleAnimFrameRef.current = requestAnimationFrame(syncLoop);
      } catch (err) {}
    };

    fetchAndParseSubtitle();

    // --- STRATEGI 2: Native <track> injection ---
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
      if (subtitleAnimFrameRef.current) cancelAnimationFrame(subtitleAnimFrameRef.current);
    };
  }, [proxiedSubtitleUrl]);



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
                const totalEps = episodes?.length || 9999;
                if (deltaY > 80 && currentEpisode < totalEps) goToEpisode(currentEpisode + 1);
                else if (deltaY < -80 && currentEpisode > 1) goToEpisode(currentEpisode - 1);
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
    }, [currentEpisode, episodes]);

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
                    background: transparent !important;
                    background-color: rgba(0, 0, 0, 0) !important;
                    text-shadow: 
                        2px 2px 0 #000,
                       -2px -2px 0 #000,
                        2px -2px 0 #000,
                       -2px  2px 0 #000,
                        0 2px 4px rgba(0,0,0,0.8),
                        0 0 10px rgba(0,0,0,1) !important;
                    font-family: "Inter", -apple-system, sans-serif !important;
                    font-size: 1.2rem !important;
                    font-weight: 900 !important;
                    outline: none !important;
                }
                ::-webkit-media-text-track-display {
                    background: transparent !important;
                    background-color: transparent !important;
                    overflow: visible !important;
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
              {currentEpisodeData ? `Episode ${currentEpisodeData.index + 1}` : "Episode ?"}
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
          {currentVideoUrl ? (
            <video
              ref={videoRef}
              controls
              playsInline
              crossOrigin="anonymous"
              webkit-playsinline="true"
              className={`w-full h-full max-h-[100dvh] transition-all duration-300 ${isZoomed ? "object-cover" : "object-contain"}`} controlsList="nofullscreen"
              poster={drama.cover}
              onEnded={handleVideoEnded}
               // @ts-ignore
              referrerPolicy="no-referrer"
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
          ) : (
            <div className="absolute inset-0 flex items-center justify-center z-20 flex-col gap-4">
              <p className="text-white/60">URL Video tidak ditemukan</p>
            </div>
          )}

          {/* Subtitle Overlay (Hybrid CSS) */}
          {currentSubtitleText && (
            <div className="absolute bottom-24 sm:bottom-32 left-0 right-0 px-4 pointer-events-none z-[60]">
              <div className="flex flex-col items-center gap-1">
                {currentSubtitleText.split('\n').map((line, i) => (
                  <span
                    key={i}
                    className="inline-block text-white text-center text-sm sm:text-base md:text-lg lg:text-xl font-bold tracking-wide"
                    style={{
                      textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,1)',
                      lineHeight: '1.2'
                    }}
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Controls Overlay - Bottom */}
        <div className={`absolute bottom-20 md:bottom-12 left-0 right-0 z-40 pointer-events-none flex justify-center pb-safe-area-bottom transition-opacity duration-300 ${isZoomed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <div className="flex items-center gap-2 md:gap-6 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-full border border-white/10 shadow-lg transition-all scale-90 md:scale-100 origin-bottom">
            <button
              onClick={() => {
                const prev = episodes[currentIndex - 1];
                if (prev) handleEpisodeChange(prev.id);
              }}
              disabled={currentIndex <= 0}
              className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            </button>

            <span className="text-white font-medium text-xs md:text-sm tabular-nums min-w-[60px] md:min-w-[80px] text-center">
              Ep {currentEpisodeData ? (currentEpisodeData.index || 0) + 1 : 1} / {totalEpisodes}
            </span>

            <button
              onClick={() => {
                const next = episodes[currentIndex + 1];
                if (next) handleEpisodeChange(next.id);
              }}
              disabled={currentIndex >= totalEpisodes - 1}
              className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
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
              {episodes.map((ep: any) => (
                <button
                  key={ep.id}
                  onClick={() => handleEpisodeChange(ep.id)}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all",
                    ep.id === activeEpisodeId
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {(ep.index || 0) + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
