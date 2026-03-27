"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useEpisodes, useDramaDetail } from "@/hooks/useDramaDetail";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { ChevronLeft, Loader2, List, AlertCircle, ChevronRight } from "lucide-react";
import Hls from "hls.js";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

export default function DramaBoxWatchPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const searchParams = useSearchParams();

  // State
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [showList, setShowList] = useState(false);

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

    // Helper: Determine URL
    let finalUrl = "";
    if (currentEpisode.cdnList?.length) {
      const defaultCdn = currentEpisode.cdnList.find(c => c.isDefault === 1) || currentEpisode.cdnList[0];
      const defaultPath = defaultCdn.videoPathList?.find(v => v.isDefault === 1 || v.quality === 720) || defaultCdn.videoPathList?.[0];
      if (defaultPath?.videoPath) finalUrl = defaultPath.videoPath;
    }
    if (!finalUrl) finalUrl = currentEpisode.videoUrl || "";

    // FALLBACK: If no direct URL, use our Backend Resolver
    if (!finalUrl && bookId && currentEpisode) {
      finalUrl = `/api/tools/resolve?source=dramabox&bookId=${bookId}&chapterId=${currentEpisode.chapterId || ""}&ep=${currentEpisode.chapterIndex || ""}`;
    }

    // USE PROXY to bypass CORS
    if (finalUrl && finalUrl.startsWith("http")) {
      return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
    }
    return finalUrl;
  }, [currentEpisode]);

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
      const prefetchUrl = `/api/tools/resolve?source=dramabox&bookId=${bookId}&chapterId=${nextEpisode.chapterId}&ep=${nextEpisode.chapterIndex}`;

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
          onEnded={() => {
            if (currentEpisodeIndex < sortedEpisodes.length - 1) {
              setCurrentEpisodeIndex(prev => prev + 1);
            }
          }}
        />

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

function HlsVideoPlayer({ src, poster, onEnded }: { src: string; poster: string; onEnded?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!src) return;

    let hls: Hls | null = null;

    // Check if URL is HLS or proxied HLS
    const isM3U8 = src.includes('.m3u8') || (src.includes('/proxy') && src.includes('.m3u8'));

    if (Hls.isSupported() && isM3U8) {
      hls = new Hls({
        xhrSetup: function (xhr, url) {
          // Opsional: Custom headers jika perlu, tapi proxy sudah handle
        }
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) console.log("HLS Fatal Error:", data);
      });
    } else {
      // Native support (Safari) or MP4
      video.src = src;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      playsInline
      className="w-full h-full object-contain max-h-[100dvh]"
      poster={poster}
      onEnded={onEnded}
    />
  );
}
