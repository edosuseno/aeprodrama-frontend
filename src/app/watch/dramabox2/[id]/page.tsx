"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useDramabox2Detail, useDramabox2Watch } from "@/hooks/useDramabox2";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { ChevronLeft, Loader2, List, AlertCircle } from "lucide-react";
import Hls from "hls.js";
import { getBackendBase } from "@/lib/api-utils";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

export default function Dramabox2WatchPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  // State
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [showList, setShowList] = useState(false);

  // Fetch Data
  const { data: detail, isLoading: detailLoading } = useDramabox2Detail(id || "");
  const { addToHistory } = useHistoryStore();

  const episodes = useMemo(() => detail?.episodes || [], [detail]);
  const currentEpisode = episodes[currentEpisodeIndex];

  // Sync with URL ep param
  useEffect(() => {
    const ep = searchParams.get("ep");
    if (ep && episodes.length > 0) {
      const idx = episodes.findIndex(e => e.index.toString() === ep);
      if (idx !== -1) setCurrentEpisodeIndex(idx);
    }
  }, [searchParams, episodes]);

  // Fetch Stream URL
  const { data: directStreamUrl, isLoading: streamLoading } = useDramabox2Watch(id || "", currentEpisode?.index || 1);

  useEffect(() => {
    if (detail && currentEpisode) {
      const epNum = currentEpisode?.index || currentEpisodeIndex + 1;
      addToHistory({
        id: id,
        title: detail.title,
        poster: detail.cover,
        platform: "dramabox2",
        episodeNumber: epNum,
        link: `/watch/dramabox2/${id}?ep=${epNum}`
      });
    }
  }, [id, currentEpisode, detail, addToHistory, currentEpisodeIndex]);

  // Video URL with Proxy
  const videoUrl = useMemo(() => {
    const url = directStreamUrl || currentEpisode?.videoAddress;
    if (!url) return "";
    
    // Use backend proxy to bypass CORS
    if (url.startsWith("http")) {
      return `${getBackendBase()}/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
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
        <Link href={`/detail/dramabox2/${id}`} className="pointer-events-auto flex items-center gap-2 p-2 bg-black/20 backdrop-blur rounded-full text-white hover:bg-white/20 transition">
          <ChevronLeft className="w-6 h-6" />
          <span className="text-primary font-bold hidden sm:inline leading-none">AE PRO v2</span>
        </Link>
        <div className="text-white text-center drop-shadow-md">
          <h2 className="font-bold text-sm md:text-base line-clamp-1">{detail?.title || "Dramabox v2"}</h2>
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
      <div className="flex-1 w-full h-full flex items-center justify-center bg-black relative">
        {streamLoading ? (
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-white/70 text-sm">Mengambil Stream Video...</p>
            </div>
        ) : videoUrl ? (
            <VideoPlayer 
                src={videoUrl} 
                poster={detail?.cover || ""} 
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
                <p className="text-white/50 text-xs max-w-xs">Token vidrama mungkin sudah kadaluarsa atau video ini memerlukan akses VIP.</p>
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
                  ? "bg-primary text-primary-foreground"
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

function VideoPlayer({ src, poster, onEnded }: { src: string; poster: string; onEnded?: () => void }) {
  const videoRef = (el: HTMLVideoElement | null) => {
    if (!el || !src) return;
    
    if (Hls.isSupported() && (src.includes('.m3u8') || src.includes('.m3u') || src.includes('proxy'))) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(el);
      hls.on(Hls.Events.MANIFEST_PARSED, () => el.play().catch(() => {}));
    } else {
      el.src = src;
      el.play().catch(() => {});
    }
  };

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      className="w-full h-full object-contain"
      poster={poster}
      onEnded={onEnded}
    />
  );
}
