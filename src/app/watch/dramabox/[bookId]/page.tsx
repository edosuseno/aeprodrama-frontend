"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useEpisodes, useDramaDetail } from "@/hooks/useDramaDetail";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { ChevronLeft, Loader2, List, AlertCircle, ChevronRight, Settings, Check } from "lucide-react";
import Hls from "hls.js";
import { getBackendBase } from "@/lib/api-utils";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

export default function DramaBoxWatchPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const searchParams = useSearchParams();

  // State
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [showList, setShowList] = useState(false);

  // Quality Selection State
  const [availableLevels, setAvailableLevels] = useState<any[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [manualQuality, setManualQuality] = useState<number | null>(null); // For Hard URL Switching
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  const handleLevelsFound = (levels: any[]) => {
    setAvailableLevels(levels);
  };

  // Ref untuk area swipe vertikal (mobile)
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  // Fetch Data
  const { data: episodes, isLoading: episodesLoading } = useEpisodes(bookId);
  const { data: detail } = useDramaDetail(bookId);
  const { addToHistory } = useHistoryStore();

  // Normalize Detail Data
  const normalizedDetail = useMemo(() => {
    if (!detail) return null;
    const anyDetail = detail as any;
    // Handle various structures safely
    return {
      bookName: anyDetail.bookName || anyDetail.data?.book?.bookName || "DramaBox",
      cover: anyDetail.cover || anyDetail.coverWap || anyDetail.data?.book?.cover || ""
    };
  }, [detail]);
  const sortedEpisodes = useMemo(() => {
    if (!episodes) return [];
    return [...episodes].sort((a, b) => a.chapterIndex - b.chapterIndex);
  }, [episodes]);

  const currentEpisode = sortedEpisodes[currentEpisodeIndex];

  // Sync with URL ep param
  useEffect(() => {
    const ep = searchParams.get("ep");
    if (ep && sortedEpisodes.length > 0) {
      const idx = sortedEpisodes.findIndex(e => e.chapterIndex.toString() === ep);
      if (idx !== -1) setCurrentEpisodeIndex(idx);
    }
  }, [searchParams, sortedEpisodes]);

  useEffect(() => {
    if (detail && currentEpisode) {
      const anyDetail = detail as any;
      const epNum = currentEpisode?.chapterIndex || currentEpisodeIndex + 1;
      addToHistory({
        id: bookId,
        title: anyDetail.bookName || anyDetail.data?.book?.bookName || "DramaBox",
        poster: anyDetail.cover || anyDetail.coverWap || anyDetail.data?.book?.cover || "",
        platform: "dramabox",
        episodeNumber: epNum,
        link: `/watch/dramabox/${bookId}?ep=${epNum}`
      });
    }
  }, [bookId, currentEpisode, detail, addToHistory, currentEpisodeIndex]);

  // Helper: Get Video URL
  const videoUrl = useMemo(() => {
    if (!currentEpisode) return "";

    // 1. Ambil URL dari cdnList jika ada (Gunakan manualQuality jika dipilih)
    let finalUrl = "";
    if (currentEpisode.cdnList?.length) {
      const defaultCdn = currentEpisode.cdnList.find((c: any) => c.isDefault === 1) || currentEpisode.cdnList[0];
      const videoPathList = defaultCdn.videoPathList || [];

      let selectedPath;
      if (manualQuality !== null) {
        selectedPath = videoPathList.find((v: any) => v.quality === manualQuality);
      }

      if (!selectedPath) {
        selectedPath = videoPathList.find((v: any) => v.isDefault === 1 || v.quality === 720) || videoPathList[0];
      }

      if (selectedPath?.videoPath) finalUrl = selectedPath.videoPath;
    }
    if (!finalUrl) finalUrl = currentEpisode.videoUrl || "";

    // 2. Jika tidak ada URL sama sekali → gunakan stream-resolver ke backend
    if (!finalUrl && bookId && currentEpisode) {
      return `${getBackendBase()}/tools/stream-resolver?source=dramabox&bookId=${bookId}&chapterId=${currentEpisode.chapterId || ""}&ep=${currentEpisode.chapterIndex || ""}`;
    }

    // JIKA URL MENGANDUNG ENKREPSI (etavirp_nuyila / .encrypt.mp4), BUNGKUS DENGAN DECRYPTOR SANSEKAI
    if (finalUrl && (finalUrl.includes('.encrypt.mp4') || finalUrl.includes('etavirp_nuyila'))) {
      if (!finalUrl.includes('decrypt?url=')) {
        finalUrl = `https://api.sansekai.my.id/api/dramabox/decrypt?url=${encodeURIComponent(finalUrl)}`;
      }
    }

    // USE PROXY to bypass CORS (Pointing to Backend port 5001)
    if (finalUrl && finalUrl.startsWith("http")) {
      const isHlsUrl = finalUrl.includes('.m3u8') || finalUrl.includes('.m3u');
      if (isHlsUrl) {
        return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
      }
      // MP4 atau lainnya jangan diproksi (Bypass Vercel timeout & range bug)
      return finalUrl;
    }
    return finalUrl;
  }, [currentEpisode, bookId, manualQuality]);


  // Keep track of the last valid URL to prevent player unmounting/blanking during transitions
  const [activeUrl, setActiveUrl] = useState("");

  useEffect(() => {
    if (videoUrl) {
      setActiveUrl(videoUrl);
    }
  }, [videoUrl]);

  // Prefetch next episode in background when current episode loads
  useEffect(() => {
    if (!sortedEpisodes.length || currentEpisodeIndex >= sortedEpisodes.length - 1) return;

    const nextEpisode = sortedEpisodes[currentEpisodeIndex + 1];
    if (!nextEpisode || nextEpisode.videoUrl) return; // Skip if already has URL

    // Prefetch after 2 seconds of current episode loading
    const timer = setTimeout(() => {
      const prefetchUrl = `/api/tools/stream-resolver?source=dramabox&bookId=${bookId}&chapterId=${nextEpisode.chapterId}&ep=${nextEpisode.chapterIndex}`;

      // Silent prefetch (won't show in UI)
      fetch(prefetchUrl, { method: 'HEAD' }).catch(() => { });
    }, 2000);


    return () => clearTimeout(timer);
  }, [currentEpisodeIndex, sortedEpisodes, bookId]);

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
        setCurrentEpisodeIndex((prev) => Math.min(sortedEpisodes.length - 1, prev + 1));
      } else if (deltaY < -80) {
        // Swipe ke bawah → episode sebelumnya
        setCurrentEpisodeIndex((prev) => Math.max(0, prev - 1));
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sortedEpisodes.length]);

  // Loading State
  // Don't show full screen loader if we have activeUrl (allow persistence for smooth transition)
  if (episodesLoading && !activeUrl) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Memuat Episode...</span>
      </div>
    );
  }

  // Error/Empty State
  if (!sortedEpisodes.length && !episodesLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
        <h1 className="text-xl font-bold">Video Tidak Ditemukan</h1>
        <p className="opacity-70">Maaf, episode untuk drama ini belum tersedia atau gagal dimuat.</p>
        <Link href="/" className="mt-4 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black flex flex-col">
      {/* 1. Navbar Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <Link href={`/detail/dramabox/${bookId}`} className="pointer-events-auto flex items-center gap-2 p-2 bg-black/20 backdrop-blur rounded-full text-white hover:bg-white/20 transition">
          <ChevronLeft className="w-6 h-6" />
          <div className="flex flex-col -gap-1">
            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md leading-none">AE PRO</span>
            <span className="text-[10px] text-white/70 hidden sm:inline leading-none">PUSAT DRAMA</span>
          </div>
        </Link>
        <div className="text-white text-center drop-shadow-md">
          <h2 className="font-bold text-sm md:text-base line-clamp-1">{normalizedDetail?.bookName || "DramaBox"}</h2>
          <p className="text-xs opacity-80">
            Episode {currentEpisode?.chapterIndex || currentEpisodeIndex + 1} / {sortedEpisodes.length}
          </p>
        </div>
        <button
          onClick={() => setShowList(prev => !prev)}
          className="pointer-events-auto p-2 bg-black/20 backdrop-blur rounded-full text-white hover:bg-white/20 transition"
        >
          <List className="w-6 h-6" />
        </button>
      </div>

      {/* 2. Video Player */}
      <div ref={swipeContainerRef} className="flex-1 w-full h-full flex items-center justify-center bg-black relative group">
        <HlsVideoPlayer
          src={activeUrl}
          poster={currentEpisode?.cover || normalizedDetail?.cover || ""}
          onLevelsFound={handleLevelsFound}
          manualLevel={currentQuality}
          onEnded={() => {
            if (currentEpisodeIndex < sortedEpisodes.length - 1) {
              setCurrentEpisodeIndex(prev => prev + 1);
            }
          }}
        />

        {/* Quality Selector Overlay */}
        <div className="absolute top-4 right-4 z-50 pointer-events-auto">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setIsQualityMenuOpen(!isQualityMenuOpen); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 transition-all ${isQualityMenuOpen ? 'bg-primary text-black' : 'bg-black/40 text-white hover:bg-white/10'}`}
            >
              <Settings size={18} className={isQualityMenuOpen ? 'animate-spin-slow' : ''} />
              <span className="text-xs font-bold whitespace-nowrap">
                {manualQuality ? `${manualQuality}p` : (currentQuality === -1 ? 'Auto' : `${availableLevels[currentQuality]?.height}p`)}
              </span>
            </button>

            {isQualityMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-3 py-2 border-b border-white/5 bg-white/5">
                  <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Kualitas Video</span>
                </div>
                
                <button
                  onClick={() => { setManualQuality(null); setCurrentQuality(-1); setIsQualityMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition ${manualQuality === null && currentQuality === -1 ? 'text-primary bg-primary/5' : 'text-zinc-400 hover:bg-white/5'}`}
                >
                  Otomatis (Auto) {manualQuality === null && currentQuality === -1 && <Check size={14} />}
                </button>

                {/* DramaBox Manual Quality from CDN List */}
                {currentEpisode?.cdnList?.[0]?.videoPathList?.map((path: any) => (
                  <button
                    key={`cdn-${path.quality}`}
                    onClick={() => { setManualQuality(path.quality); setIsQualityMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition ${manualQuality === path.quality ? 'text-primary bg-primary/5' : 'text-zinc-400 hover:bg-white/5'}`}
                  >
                    {path.quality}p {manualQuality === path.quality && <Check size={14} />}
                  </button>
                ))}

                {/* Additional Source Suggestion if Black Screen */}
                <div className="px-3 py-2 border-t border-white/5 bg-black/20">
                   <p className="text-[9px] text-white/40 italic text-center">Pilih resolusi manual jika layar hitam.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Show overlay if videoUrl is processing (not yet activeUrl) implies loading next ep */}
        {(!videoUrl || videoUrl !== activeUrl) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 pointer-events-none">
            <div className="text-white text-lg font-bold drop-shadow-md animate-pulse">Memuat...</div>
          </div>
        )}

        <UnifiedVideoNavigation
          currentEpisode={currentEpisodeIndex + 1}
          totalEpisodes={sortedEpisodes.length}
          onPrev={() => setCurrentEpisodeIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setCurrentEpisodeIndex((prev) => Math.min(sortedEpisodes.length - 1, prev + 1))}
        />

      </div>

      {/* 3. Playlist Sidebar */}
      {
        showList && (
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-gray-900/95 backdrop-blur shadow-xl border-l border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center text-white">
              <h3 className="font-bold">Daftar Episode</h3>
              <button onClick={() => setShowList(false)}><ChevronLeft className="rotate-180" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 grid grid-cols-4 gap-2 content-start">
              {sortedEpisodes.map((ep, idx) => (
                <button
                  key={ep.chapterId || idx}
                  onClick={() => {
                    setCurrentEpisodeIndex(idx);
                    setShowList(false); // Opsional: tutup list setelah pilih
                  }}
                  className={`p-2 rounded text-sm font-medium transition ${idx === currentEpisodeIndex
                    ? "bg-red-600 text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                >
                  {ep.chapterIndex}
                </button>
              ))}
            </div>
          </div>
        )
      }
    </div >
  );
}

function HlsVideoPlayer({ src, poster, onEnded, onLevelsFound, manualLevel }: {
  src: string;
  poster: string;
  onEnded?: () => void;
  onLevelsFound?: (levels: any[]) => void;
  manualLevel?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Handle Manual Level Switch
  useEffect(() => {
    if (hlsRef.current && typeof manualLevel === 'number') {
      hlsRef.current.currentLevel = manualLevel;
    }
  }, [manualLevel]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Reset error state
    setVideoError(null);

    // Deteksi apakah URL adalah stream HLS (m3u8 atau proxy route)
    const isM3U8 = src.includes('.m3u8') || src.includes('/proxy/video') || src.includes('stream-resolver');

    if (Hls.isSupported() && isM3U8) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        fragLoadingMaxRetry: 10,
        manifestLoadingMaxRetry: 5,
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = false;
        }
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("HLS Manifest Parsed - Playing Video. Levels:", data.levels?.length);

        // Notify parent about available levels
        if (onLevelsFound) {
          onLevelsFound(data.levels || []);
        }

        video.play().catch(err => {
          console.warn("Autoplay was blocked - user interaction needed");
          setVideoError("Autoplay diblokir oleh browser. Silakan klik play secara manual.");
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data.type, data.details, data.fatal);

        // Jika manifest gagal di-parse (bukan HLS), fallback ke native playback
        if (data.fatal && (data.details === 'manifestParsingError' || data.details === 'manifestIncompatibleCodecsError')) {
          console.log("Bukan stream HLS, fallback ke native playback...");
          hls.destroy();
          hlsRef.current = null;
          video.src = src;
          video.load();
          video.play().catch(() => { });
          return;
        }

        if (data.fatal) {
          let errorMessage = "Terjadi kesalahan fatal pada stream video";

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              errorMessage = "Kesalahan jaringan. Mencoba memulihkan...";
              console.log("Attemping to recover from network error...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              errorMessage = "Kesalahan media. Mencoba memulihkan...";
              console.log("Attemping to recover from media error...");
              hls.recoverMediaError();
              break;
            default:
              errorMessage = `Kesalahan tidak terduga: ${data.details}`;
              console.log("Cannot recover, destroying...");
              hls.destroy();
              break;
          }

          setVideoError(errorMessage);
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log("Switched to level:", data.level);
      });
    } else {
      console.log("Using native video playback (Safari/MP4)");
      video.src = src;
      video.load();

      video.play().catch((e) => {
        console.warn("Native Autoplay blocked:", e);
        setVideoError("Autoplay diblokir oleh browser. Silakan klik play secara manual.");
      });

      video.onerror = (e) => {
        console.error("Native Video Error:", video.error?.code, video.error?.message);

        let errorMessage = "Kesalahan video native";
        if (video.error) {
          switch (video.error.code) {
            case 1: // MEDIA_ERR_ABORTED
              errorMessage = "Video dibatalkan";
              break;
            case 2: // MEDIA_ERR_NETWORK
              errorMessage = "Kesalahan jaringan";
              break;
            case 3: // MEDIA_ERR_DECODE
              errorMessage = "Kesalahan dekode video";
              break;
            case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
              errorMessage = "Format video tidak didukung atau URL tidak valid";
              break;
            default:
              errorMessage = `Kesalahan video: ${video.error.message}`;
          }
        }

        setVideoError(errorMessage);
        console.warn("Kemungkinan besar API Sansekai sedang down atau mengembalikan JSON error, sehingga gagal diputar sebagai video.");
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <video
        ref={videoRef}
        controls
        playsInline
        className="w-full h-full object-contain max-h-[100dvh]"
        poster={poster}
        onEnded={onEnded}
        preload="auto"
      />

      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center text-white p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2">Gagal Memutar Video</h3>
            <p className="text-sm opacity-90 mb-4 max-w-xs">{videoError}</p>

            {videoError.includes("Autoplay diblokir") && (
              <div className="mb-4 p-3 bg-white/10 rounded-lg">
                <p className="text-xs mb-2 text-white/80">Cara mengatasi:</p>
                <ul className="text-xs text-white/60 space-y-1">
                  <li>• Klik ikon play di tengah video</li>
                  <li>• Di browser, izinkan autoplay untuk situs ini</li>
                  <li>• Di Chrome/Safari: klik ikon "i" di address bar</li>
                  <li>• Di Firefox: atur "Autoplay" ke "Allow"</li>
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                const video = videoRef.current;
                if (video) {
                  video.play().catch(() => { });
                  setVideoError(null);
                }
              }}
              className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/80 transition font-medium shadow-lg"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Overlay Play Button for Autoplay Blocked */}
      {!videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 pointer-events-none">
          <button
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                video.play().catch((e) => {
                  console.warn("Manual play failed:", e);
                  setVideoError("Gagal memutar video. Silakan coba lagi.");
                });
              }
            }}
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center pointer-events-auto hover:bg-white/30 transition transform hover:scale-110"
          >
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

