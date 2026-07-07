"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNetShortDetail, useNetShortWatch } from "@/hooks/useNetShort";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, List } from "lucide-react";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Hls from "hls.js";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

// --- VTT Parser & CSS Subtitle Overlay untuk iOS Safari ---
interface VttCue {
  start: number;
  end: number;
  text: string;
}

function parseVttTime(timeStr: string): number {
  // Format: HH:MM:SS.mmm atau MM:SS.mmm
  const parts = timeStr.trim().split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return 0;
}

function parseVtt(vttText: string): VttCue[] {
  const cues: VttCue[] = [];
  // Normalisasi SRT ke VTT (ganti koma dengan titik pada timestamp)
  let text = vttText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  // Hapus header WEBVTT dan metadata
  const blocks = text.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    let timeLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeLine = i;
        break;
      }
    }
    if (timeLine === -1) continue;
    const [startStr, endStr] = lines[timeLine].split('-->').map(s => s.trim().split(' ')[0]);
    const textLines = lines.slice(timeLine + 1).join('\n').trim();
    if (startStr && endStr && textLines) {
      cues.push({
        start: parseVttTime(startStr),
        end: parseVttTime(endStr),
        text: textLines.replace(/<[^>]*>/g, ''), // Hapus tag HTML dalam cue
      });
    }
  }
  return cues;
}

// Deteksi iOS/iPadOS
function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function NetShortWatchPage() {
  const params = useParams<{ shortPlayId: string }>();
  const searchParams = useSearchParams();
  const shortPlayId = params.shortPlayId;
  const router = useRouter();

  const [currentEpisode, setCurrentEpisode] = useState(1);
    const [showEpisodeList, setShowEpisodeList] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Ref untuk area swipe vertikal (mobile)
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  // State untuk CSS-based subtitle overlay (fallback iOS Safari)
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>("");
  const vttCuesRef = useRef<VttCue[]>([]);
  const subtitleAnimFrameRef = useRef<number>(0);

  // Debug log state (kept internal for now, can be exposed if needed)
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const addLog = (msg: string) => {
    console.log(msg);
    // setDebugLog(prev => [...prev.slice(-4), msg]); 
  };

  // Get episode from URL
  useEffect(() => {
    const ep = searchParams.get("ep");
    if (ep) {
      setCurrentEpisode(parseInt(ep) || 1);
    }
  }, [searchParams]);

  // Fetch detail with all episodes
  const { data, isLoading: isDetailLoading, error } = useNetShortDetail(shortPlayId || "");

  // Fetch stream via StardustTV fallback
  const { data: watchData, isLoading: isWatchLoading } = useNetShortWatch(shortPlayId || "", currentEpisode);

  const isLoading = isDetailLoading || isWatchLoading;

  const { addToHistory } = useHistoryStore();

  // Catat ke History
  useEffect(() => {
    if (data && shortPlayId) {
      addToHistory({
        id: String(shortPlayId),
        title: data.title,
        poster: data.cover,
        platform: "NetShort",
        episodeNumber: currentEpisode,
        link: `/watch/netshort/${shortPlayId}?ep=${currentEpisode}`
      });
    }
  }, [shortPlayId, currentEpisode, data, addToHistory]);

  // Get current episode data
  const currentEpisodeData = data?.episodes?.find(
    (ep) => ep.episodeNo === currentEpisode
  );

  // Handle video ended - auto next episode
  const handleVideoEnded = useCallback(() => {
    if (!data?.episodes) return;
    const nextEp = currentEpisode + 1;
    const nextEpisodeData = data.episodes.find((ep) => ep.episodeNo === nextEp);

    if (nextEpisodeData) {
      setCurrentEpisode(nextEp);
      window.history.replaceState(null, '', `/watch/netshort/${shortPlayId}?ep=${nextEp}`);
    }
  }, [currentEpisode, data?.episodes, shortPlayId]);

  // Load video with fallback support for MP4/HLS
  useEffect(() => {
    const videoUrlRaw = watchData?.url || currentEpisodeData?.videoUrl;
    if (videoUrlRaw && videoRef.current) {
      const video = videoRef.current;
      
      // FIX: Ekstrak original URL dan pastikan selalu lewat frontend proxy untuk mencegah masalah CORS/Mixed Content di VPS
      let originalUrl = videoUrlRaw;
      if (videoUrlRaw.includes('/api/proxy')) {
        try {
          const parsed = new URL(videoUrlRaw, window.location.origin);
          const extractedUrl = parsed.searchParams.get('url');
          if (extractedUrl) {
            originalUrl = extractedUrl;
          }
        } catch {}
      }
      
      // Gunakan origin dinamis sesuai window.location agar sesuai dengan protokol saat ini (HTTP/HTTPS)
      const proxyBaseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
      // BYPASS PROXY untuk awscdn.netshort.com karena Node.js sering gagal verifikasi SSL certificate-nya,
      // dan browser bisa memutarnya langsung via <video src="..."> tanpa masalah CORS.
      const isNetshortCdn = originalUrl.includes('awscdn.netshort.com');
      const videoUrl = isNetshortCdn ? originalUrl : `${proxyBaseUrl}/api/proxy?url=${encodeURIComponent(originalUrl)}`;

      addLog(`Loading video: ${videoUrl}`);

      // Clean up previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const isHlsUrl = videoUrl.includes('.m3u8') || videoUrl.includes('application/x-mpegURL');
      const isMp4Url = videoUrl.includes('.mp4') || videoUrl.includes('mime_type=video_mp4');

      // Priority 1: HLS.js for .m3u8 (if supported)
      if (isHlsUrl && Hls.isSupported()) {
        addLog("Detected HLS stream, initializing HLS.js...");
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
          addLog("Manifest parsed, playing...");
          video.play().catch((e) => addLog(`Auto-play failed: ${e.message}`));
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          const errorMsg = `HLS Error: ${data.type} - ${data.details}`;
          console.error(errorMsg);

          if (data.fatal) {
            // ... error handling
            // If HLS fails fatally, we could try native as last ditch, but usually fatal means fatal.
            hls.destroy();
          }
        });
      }
      // Priority 2: Native playback (MP4 or Native HLS on Safari)
      else {
        addLog(isMp4Url ? "Detected MP4/Native stream" : "Unknown format, trying native playback");
        video.src = videoUrl;
        video.load(); // Ensure source update

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            addLog(`Native play failed: ${e.message}`);
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
  }, [watchData?.url, currentEpisodeData?.videoUrl]);



  const goToEpisode = (ep: number) => {
    setCurrentEpisode(ep);
    router.replace(`/watch/netshort/${shortPlayId}?ep=${ep}`, { scroll: false });
    setShowEpisodeList(false);
  };

  const totalEpisodes = data?.totalEpisodes || 1;

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
                const totalEps = data?.totalEpisodes || data?.episodes?.length || data?.chapterCount || 9999;
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
    }, [currentEpisode, data]);

  // Manual Subtitle Injection & Enforcement (Hybrid: native track + CSS overlay untuk iOS)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // FIX: Prioritaskan currentEpisodeData (fresh dari API) di atas watchData (bisa jadi dari cache lama server yang URL-nya sudah expired / 404)
    const subtitleUrlRaw = currentEpisodeData?.subtitleUrl || watchData?.subtitle;
    // FIX: Hindari double proxy di VPS
    // Backend sudah memproxy subtitle jadi 'https://vps-host/api/proxy?url=<asli>'
    // Tapi browser mengirim request ke Next.js frontend yang hanya punya /api/proxy/video
    // Solusi: ekstrak URL asli dari backend proxy, lalu bungkus ulang dengan frontend proxy
    let subtitleProxyUrl = "";
    if (subtitleUrlRaw) {
      let originalSubUrl = subtitleUrlRaw;
      // Jika URL sudah di-proxy backend (mengandung /api/proxy?url=), ekstrak URL aslinya
      if (subtitleUrlRaw.includes('/api/proxy')) {
        try {
          const parsed = new URL(subtitleUrlRaw, window.location.origin);
          const extractedUrl = parsed.searchParams.get('url');
          if (extractedUrl) {
            originalSubUrl = extractedUrl;
          }
        } catch {
          // Jika gagal parse, gunakan apa adanya
        }
      }
      // Selalu gunakan proxy /api/proxy yang terhubung ke backend kecuali untuk CDN yang punya CORS dan bermasalah dengan Node.js SSL
      if (originalSubUrl.includes('awscdn.netshort.com')) {
        subtitleProxyUrl = originalSubUrl;
      } else {
        subtitleProxyUrl = `/api/proxy?url=${encodeURIComponent(originalSubUrl)}`;
      }
    }

    // Reset CSS subtitle state
    setCurrentSubtitleText("");
    vttCuesRef.current = [];
    if (subtitleAnimFrameRef.current) {
      cancelAnimationFrame(subtitleAnimFrameRef.current);
      subtitleAnimFrameRef.current = 0;
    }

    if (!subtitleProxyUrl) return;

    const isiOS = isIOSDevice();

    // --- STRATEGI 1: CSS Overlay (utama untuk iOS, fallback untuk semua) ---
    // Fetch VTT/SRT lalu parse manual, render sebagai HTML overlay
    const fetchAndParseSubtitle = async () => {
      try {
        addLog(`[Subtitle] Fetching subtitle: ${subtitleProxyUrl}`);
        const res = await fetch(subtitleProxyUrl);
        if (!res.ok) {
          addLog(`[Subtitle] Fetch gagal: ${res.status}`);
          return;
        }
        const text = await res.text();
        const cues = parseVtt(text);
        addLog(`[Subtitle] Parsed ${cues.length} cues`);
        vttCuesRef.current = cues;

        // Mulai loop sinkronisasi subtitle dengan waktu video
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
      } catch (err) {
        addLog(`[Subtitle] Parse error: ${(err as Error).message}`);
      }
    };

    fetchAndParseSubtitle();

    // --- STRATEGI 2: Native <track> injection (untuk desktop/Android) ---
    // Tetap coba inject native track sebagai backup
    if (!isiOS) {
      const injectTrack = () => {
        if (!subtitleProxyUrl) return;
        const tracks = Array.from(video.getElementsByTagName('track'));
        const existing = tracks.find(t => t.label === 'Indonesia' && t.srclang === 'id');

        if (existing) {
          if (existing.src === subtitleProxyUrl) return;
          else video.removeChild(existing);
        }

        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = 'Indonesia';
        track.srclang = 'id';
        track.default = true;
        track.src = subtitleProxyUrl;

        track.onload = () => {
          if (track.track) track.track.mode = 'showing';
        };

        video.appendChild(track);
      };

      const enforce = () => {
        const tracks = Array.from(video.textTracks);
        const indo = tracks.find(t => t.label === 'Indonesia' || t.language === 'id');
        if (indo && indo.mode !== 'showing') {
          indo.mode = 'showing';
        }
      };

      injectTrack();

      video.addEventListener('loadeddata', enforce);
      video.addEventListener('canplay', enforce);
      video.addEventListener('playing', enforce);
      video.addEventListener('seeked', enforce);

      if (hlsRef.current) {
        hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
          injectTrack();
          enforce();
        });
        hlsRef.current.on(Hls.Events.LEVEL_SWITCHED, () => {
          injectTrack();
          enforce();
        });
      }

      let retries = 0;
      const poll = setInterval(() => {
        injectTrack();
        enforce();
        retries++;
        if (retries > 10) clearInterval(poll);
      }, 200);

      return () => {
        video.removeEventListener('loadeddata', enforce);
        video.removeEventListener('canplay', enforce);
        video.removeEventListener('playing', enforce);
        video.removeEventListener('seeked', enforce);
        clearInterval(poll);

        if (subtitleAnimFrameRef.current) {
          cancelAnimationFrame(subtitleAnimFrameRef.current);
          subtitleAnimFrameRef.current = 0;
        }

        try {
          const tracks = Array.from(video.getElementsByTagName('track'));
          const current = tracks.find(t => t.src === subtitleProxyUrl);
          if (current) video.removeChild(current);
        } catch (e) { }
      };
    }

    // Cleanup untuk iOS (hanya CSS overlay, tanpa native track)
    return () => {
      if (subtitleAnimFrameRef.current) {
        cancelAnimationFrame(subtitleAnimFrameRef.current);
        subtitleAnimFrameRef.current = 0;
      }
      setCurrentSubtitleText("");
    };
  }, [watchData?.subtitle, currentEpisodeData?.subtitleUrl]); // Run when subtitle URL changes

  return (
    <main className="fixed inset-0 bg-black flex flex-col">
      {/* Header - Fixed Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />

        <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          <Link
            href={`/detail/netshort/${shortPlayId}`}
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
              {data?.title || "Loading..."}
            </h1>
            <p className="text-white/80 text-xs drop-shadow-md">Episode {currentEpisode}</p>
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

          <video
            ref={videoRef}
            className={`w-full h-full max-h-[100dvh] transition-all duration-300 ${isZoomed ? "object-cover" : "object-contain"}`} controlsList="nofullscreen"
            controls
            playsInline
            crossOrigin="anonymous"
            webkit-playsinline="true"
            autoPlay
            {...({ disableRemotePlayback: true, referrerPolicy: "no-referrer" } as any)}
            onEnded={handleVideoEnded}
          />

          {/* CSS Subtitle Overlay - Fallback untuk iOS Safari */}
          {currentSubtitleText && (
            <div
              className="absolute bottom-16 md:bottom-20 left-0 right-0 z-30 flex justify-center pointer-events-none px-4"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)' }}
            >
              <div
                className="max-w-[90%] md:max-w-[70%] text-center px-3 py-1.5 rounded-md"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(2px)',
                }}
              >
                <p className="text-white text-sm md:text-base leading-snug font-medium whitespace-pre-line">
                  {currentSubtitleText}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Controls Overlay - Bottom */}
        <UnifiedVideoNavigation isHidden={isZoomed}
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
              {data?.episodes?.map((episode) => (
                <button
                  key={episode.episodeId}
                  onClick={() => goToEpisode(episode.episodeNo)}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                    ${episode.episodeNo === currentEpisode
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {episode.episodeNo}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
