"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEpisodes, useDramaDetail } from "@/hooks/useDramaDetail";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { ChevronLeft, Loader2, List, AlertCircle, ChevronRight, Settings } from "lucide-react";
import Hls from "hls.js";
import { getBackendBase } from "@/lib/api-utils";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DramaBoxWatchPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [showList, setShowList] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [manualQuality, setManualQuality] = useState<number | null>(null);

  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Fetch Data
  const { data: episodes, isLoading: episodesLoading } = useEpisodes(bookId);
  const { data: detail } = useDramaDetail(bookId);
  const { addToHistory } = useHistoryStore();

  const normalizedDetail = useMemo(() => {
    if (!detail) return null;
    const anyDetail = detail as any;
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
  const totalEpisodes = sortedEpisodes.length;

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

  const qualityOptions = useMemo(() => {
    if (!currentEpisode || !currentEpisode.cdnList?.length) return [];
    const defaultCdn = currentEpisode.cdnList.find((c: any) => c.isDefault === 1) || currentEpisode.cdnList[0];
    return defaultCdn.videoPathList || [];
  }, [currentEpisode]);

  const videoUrl = useMemo(() => {
    if (!currentEpisode) return "";
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
    if (finalUrl && (finalUrl.includes('.encrypt.mp4') || finalUrl.includes('etavirp_nuyila'))) {
      if (!finalUrl.includes('decrypt-stream?url=')) {
        finalUrl = `https://api.sansekai.my.id/api/dramabox/decrypt-stream?url=${encodeURIComponent(finalUrl)}`;
      }
    }
    if (finalUrl && finalUrl.startsWith("http")) {
      const isHlsUrl = finalUrl.includes('.m3u8') || finalUrl.includes('.m3u');
      if (isHlsUrl) {
        return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
      }
      return `/api/proxy/video?url=${encodeURIComponent(finalUrl)}`;
    }
    return finalUrl;
  }, [currentEpisode, bookId, manualQuality]);

  const [activeUrl, setActiveUrl] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (videoUrl && (videoUrl.startsWith("http") || videoUrl.startsWith("/")) && !videoUrl.includes("undefined")) {
      setActiveUrl(videoUrl);
      setVideoError(null);
    } else if (bookId && currentEpisode?.chapterId) {
      // Jika cdnList tidak ada dari database, ambil secara dinamis via JSON
      const fetchRealUrl = async () => {
        try {
          const res = await fetch(`${getBackendBase()}/tools/resolve?source=dramabox&bookId=${bookId}&chapterId=${currentEpisode.chapterId}&ep=${currentEpisode.chapterIndex || ""}&json=true`);
          const data = await res.json();
          if (isMounted && data.url) {
            let realUrl = data.url;
            if (realUrl.includes('.encrypt.mp4') || realUrl.includes('etavirp_nuyila')) {
              if (!realUrl.includes('decrypt-stream?url=')) {
                realUrl = `https://api.sansekai.my.id/api/dramabox/decrypt-stream?url=${encodeURIComponent(realUrl)}`;
              }
            }
            if (realUrl.includes('.m3u8') || realUrl.includes('.m3u')) {
              setActiveUrl(`/api/proxy?url=${encodeURIComponent(realUrl)}`);
            } else {
              setActiveUrl(`/api/proxy/video?url=${encodeURIComponent(realUrl)}`);
            }
            setVideoError(null);
          } else if (isMounted) {
            setVideoError("Gagal mendapatkan link video dari server.");
          }
        } catch (e) {
          if (isMounted) setVideoError("Gagal menyambung ke server video.");
        }
      };
      fetchRealUrl();
    }
    return () => { isMounted = false; };
  }, [videoUrl, bookId, currentEpisode]);

  useEffect(() => {
    if (!sortedEpisodes.length || currentEpisodeIndex >= sortedEpisodes.length - 1) return;
    const nextEpisode = sortedEpisodes[currentEpisodeIndex + 1];
    if (!nextEpisode || nextEpisode.videoUrl) return;
    const timer = setTimeout(() => {
      const prefetchUrl = `/api/tools/stream-resolver?source=dramabox&bookId=${bookId}&chapterId=${nextEpisode.chapterId}&ep=${nextEpisode.chapterIndex}`;
      fetch(prefetchUrl, { method: 'HEAD' }).catch(() => { });
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentEpisodeIndex, sortedEpisodes, bookId]);

  const loadVideo = useCallback((src: string) => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setVideoError(null);

    // Cek jika URL memiliki ekstensi m3u8 atau menggunakan /proxy (bukan /proxy/video)
    const isM3U8 = src.includes('.m3u8') || (src.includes('/proxy') && !src.includes('/proxy/video'));

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
        video.play().catch(err => {
          console.warn("Autoplay was blocked - user interaction needed");
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal && (data.details === 'manifestParsingError' || data.details === 'manifestIncompatibleCodecsError')) {
          hls.destroy();
          hlsRef.current = null;
          video.src = src;
          video.load();
          video.play().catch(() => { });
          video.onerror = () => {
            let errorMessage = "Kesalahan video native (Fallback)";
            if (video.error) {
              switch (video.error.code) {
                case 1: errorMessage = "Video dibatalkan"; break;
                case 2: errorMessage = "Kesalahan jaringan"; break;
                case 3: errorMessage = "Kesalahan dekode video"; break;
                case 4: errorMessage = "Format video tidak didukung atau URL tidak valid"; break;
                default: errorMessage = `Kesalahan video: ${video.error.message}`;
              }
            }
            setVideoError(`[Err ${video.error?.code || '?'}] ${errorMessage}`);
          };
          return;
        }
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setVideoError("Terjadi kesalahan fatal pada stream video");
              break;
          }
        }
      });
    } else {
      video.src = src;
      video.load();
      video.play().catch((e) => {
        console.warn("Native Autoplay blocked:", e);
      });
      video.onerror = () => {
        let errorMessage = "Kesalahan video native";
        if (video.error) {
          switch (video.error.code) {
            case 1: errorMessage = "Video dibatalkan"; break;
            case 2: errorMessage = "Kesalahan jaringan"; break;
            case 3: errorMessage = "Kesalahan dekode video"; break;
            case 4: errorMessage = "Format video tidak didukung atau URL tidak valid"; break;
            default: errorMessage = `Kesalahan video: ${video.error.message}`;
          }
        }
        setVideoError(`[Err ${video.error?.code || '?'}] ${errorMessage}`);
      };
    }
  }, []);

  useEffect(() => {
    if (activeUrl) {
      loadVideo(activeUrl);
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeUrl, loadVideo]);

  const handleVideoEnded = useCallback(() => {
    if (currentEpisodeIndex < sortedEpisodes.length - 1) {
      const nextIdx = currentEpisodeIndex + 1;
      setCurrentEpisodeIndex(nextIdx);
      window.history.replaceState(null, '', `/watch/dramabox/${bookId}?ep=${sortedEpisodes[nextIdx].chapterIndex}`);
    }
  }, [currentEpisodeIndex, sortedEpisodes, bookId]);

  const goToEpisode = (idx: number) => {
    setCurrentEpisodeIndex(idx);
    router.replace(`/watch/dramabox/${bookId}?ep=${sortedEpisodes[idx].chapterIndex}`, { scroll: false });
    setShowList(false);
  };

  useEffect(() => {
    const el = swipeContainerRef.current;
    if (!el) return;

    let touchStartY = 0;
    let lastTap = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
          const currentTime = new Date().getTime();
          const tapLength = currentTime - lastTap;
          if (tapLength < 300 && tapLength > 0) {
              setIsZoomed(!isZoomed);
              e.preventDefault();
          }
          lastTap = currentTime;
      }

      if (window.innerWidth >= 768) return;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      if (Math.abs(deltaY) > 80) {
        if (deltaY > 80 && currentEpisodeIndex < totalEpisodes - 1) goToEpisode(currentEpisodeIndex + 1);
        else if (deltaY < -80 && currentEpisodeIndex > 0) goToEpisode(currentEpisodeIndex - 1);
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentEpisodeIndex, totalEpisodes, isZoomed]);

  if (episodesLoading && !activeUrl) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Memuat Episode...</span>
      </div>
    );
  }

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
    <main className="fixed inset-0 bg-black flex flex-col overflow-hidden">
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

      <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
        <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          <Link
            href={`/detail/dramabox/${bookId}`}
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
              {normalizedDetail?.bookName || "Loading..."}
            </h1>
            <p className="text-white/80 text-xs drop-shadow-md">Episode {currentEpisode?.chapterIndex || currentEpisodeIndex + 1}</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10">
                  <Settings className="w-6 h-6 drop-shadow-md" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[100]">
                <DropdownMenuItem
                  onClick={() => setManualQuality(null)}
                  className={manualQuality === null ? "text-primary font-semibold" : ""}
                >
                  Auto
                </DropdownMenuItem>
                {qualityOptions.map((option: any) => (
                  <DropdownMenuItem
                    key={`q-${option.quality}`}
                    onClick={() => setManualQuality(option.quality)}
                    className={manualQuality === option.quality ? "text-primary font-semibold" : ""}
                  >
                    {option.quality}p
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => setShowList(!showList)}
              className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <List className="w-6 h-6 drop-shadow-md" />
            </button>
          </div>
        </div>
      </div>

      <div ref={swipeContainerRef} className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          {videoError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-center p-4 z-20">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-white text-lg font-medium mb-4">{videoError}</p>
              <button
                onClick={() => loadVideo(activeUrl)}
                className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}
          <video
            ref={videoRef}
            className={`w-full h-full max-h-[100dvh] transition-all duration-300 ${isZoomed ? "object-cover" : "object-contain"}`}
            controlsList="nofullscreen"
            controls
            playsInline
            autoPlay
            poster={currentEpisode?.cover || normalizedDetail?.cover || ""}
            {...({ disableRemotePlayback: true, referrerPolicy: "no-referrer" } as any)}
            onEnded={handleVideoEnded}
          />
        </div>

        {(!videoUrl || videoUrl !== activeUrl) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 pointer-events-none">
            <div className="text-white text-lg font-bold drop-shadow-md animate-pulse">Memuat...</div>
          </div>
        )}

        <UnifiedVideoNavigation
          isHidden={isZoomed}
          currentEpisode={currentEpisodeIndex + 1}
          totalEpisodes={totalEpisodes}
          onPrev={() => currentEpisodeIndex > 0 && goToEpisode(currentEpisodeIndex - 1)}
          onNext={() => currentEpisodeIndex < totalEpisodes - 1 && goToEpisode(currentEpisodeIndex + 1)}
        />
      </div>

      {showList && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setShowList(false)}
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
                onClick={() => setShowList(false)}
                className="p-1 text-white/70 hover:text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-5 gap-2">
              {sortedEpisodes.map((ep: any, i: number) => {
                const isLocked = false; 
                return (
                  <button
                    key={ep.chapterId || i}
                    onClick={() => goToEpisode(i)}
                    className={`relative aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      currentEpisodeIndex === i
                        ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105 z-10 ring-2 ring-primary ring-offset-2 ring-offset-zinc-900"
                        : isLocked
                        ? "bg-white/5 text-white/30 cursor-not-allowed"
                        : "bg-white/5 text-white/80 hover:bg-white/15 hover:scale-105"
                    }`}
                  >
                    {ep.chapterIndex}
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
