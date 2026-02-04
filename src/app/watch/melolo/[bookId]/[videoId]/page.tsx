
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMeloloDetail, useMeloloStream } from "@/hooks/useMelolo";
import { ChevronLeft, ChevronRight, Loader2, List, AlertCircle, Settings } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Hls from "hls.js";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

interface VideoQuality {
  name: string;
  url: string;
}

export default function MeloloWatchPage() {
  const params = useParams<{ bookId: string; videoId: string }>();
  const router = useRouter();
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality | null>(null);

  // Internal state for videoId to prevent page unmount/remount on navigation
  const [currentVideoId, setCurrentVideoId] = useState(params.videoId || "");

  // Sync state with params if they change externally (e.g. back button)
  useEffect(() => {
    if (params.videoId && params.videoId !== currentVideoId) {
      setCurrentVideoId(params.videoId);
    }
  }, [params.videoId]);

  // Keep previous data to avoid unmounting video during transitions
  const { data: detailData, isLoading: detailLoading } = useMeloloDetail(params.bookId || "");
  const { data: streamData, isLoading: streamLoading, isFetching: streamFetching } = useMeloloStream(currentVideoId);

  const drama = detailData?.data?.video_data;
  const rawVideoModel = streamData?.data?.video_model;

  // Process video qualities
  const qualities = useMemo(() => {
    if (!rawVideoModel) return [];
    try {
      const parsedModel = JSON.parse(rawVideoModel);
      const videoList = parsedModel.video_list;
      if (!videoList) return [];

      const availableQualities: VideoQuality[] = [];
      const qualityMap: Record<string, string> = {
        video_1: "240p",
        video_2: "360p",
        video_3: "480p",
        video_4: "540p",
        video_5: "720p",
        video_6: "1080p",
      };

      Object.entries(videoList).forEach(([key, value]: [string, any]) => {
        if (value?.main_url) {
          try {
            const decoded = atob(value.main_url);
            let url = decoded.startsWith("http") ? decoded : value.main_url;

            availableQualities.push({
              name: qualityMap[key] || (key.includes('video_') ? key.replace('video_', '') + 'p' : key),
              url: url
            });
          } catch (e) {
            let url = value.main_url;
            availableQualities.push({
              name: qualityMap[key] || (key.includes('video_') ? key.replace('video_', '') + 'p' : key),
              url: url
            });
          }
        }
      });

      // Sort qualities (highest resolution first)
      return availableQualities.sort((a, b) => {
        const resA = parseInt(a.name) || 0;
        const resB = parseInt(b.name) || 0;
        return resB - resA;
      });
    } catch (e) {
      console.error("Error parsing video model", e);
      return [];
    }
  }, [rawVideoModel]);

  // Set default quality
  useEffect(() => {
    if (qualities.length > 0 && !selectedQuality) {
      // Default to highest quality available
      setSelectedQuality(qualities[0]);
    }
  }, [qualities, selectedQuality]);

  // Find current episode index
  const currentEpisodeIndex = drama?.video_list?.findIndex(v => v.vid === currentVideoId) ?? -1;
  const totalEpisodes = drama?.video_list?.length || 0;

  const handleEpisodeChange = (index: number) => {
    if (!drama?.video_list?.[index]) return;
    const nextVideoId = drama.video_list[index].vid;

    // Update internal state
    setCurrentVideoId(nextVideoId);

    // Update URL without triggering navigation
    const newUrl = `/watch/melolo/${params.bookId}/${nextVideoId}`;
    window.history.pushState({ path: newUrl }, "", newUrl);

    setShowEpisodeList(false);
  };

  const handleVideoEnded = () => {
    if (currentEpisodeIndex !== -1 && currentEpisodeIndex < totalEpisodes - 1) {
      handleEpisodeChange(currentEpisodeIndex + 1);
    }
  };

  // Guard: If logic fails completely and we have no data after loading
  if (!detailLoading && !drama) {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Video tidak ditemukan</h2>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Kembali
        </button>
      </main>
    )
  }

  return (
    <main className="fixed inset-0 bg-black flex flex-col">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
        <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          <Link
            href={`/detail/melolo/${params.bookId}`}
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
              {drama?.series_title || "Loading..."}
            </h1>
            <p className="text-white/80 text-xs drop-shadow-md">
              Episode {currentEpisodeIndex !== -1 ? currentEpisodeIndex + 1 : "..."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10 flex items-center gap-1">
                  <Settings className="w-6 h-6 drop-shadow-md" />
                  <span className="text-xs font-bold drop-shadow-md hidden sm:inline">{selectedQuality?.name || "..."}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
                {qualities.map((q) => (
                  <DropdownMenuItem
                    key={q.name}
                    className={`cursor-pointer ${selectedQuality?.name === q.name ? "bg-white/20" : "hover:bg-white/10"}`}
                    onClick={() => setSelectedQuality(q)}
                  >
                    {q.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setShowEpisodeList(!showEpisodeList)}
              className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <List className="w-6 h-6 drop-shadow-md" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          <HlsVideoPlayer
            src={selectedQuality?.url || ""}
            onEnded={handleVideoEnded}
            className={`w-full h-full object-contain max-h-[100dvh] ${!selectedQuality && "invisible"}`}
          />

          {!selectedQuality && !streamLoading && (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              Video unavailable
            </div>
          )}

          {/* Loading Overlay */}
          {(streamLoading || streamFetching || detailLoading) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-30 pointer-events-none">
              <Loader2 className="w-12 h-12 animate-spin text-primary drop-shadow-md" />
            </div>
          )}
        </div>

        <UnifiedVideoNavigation
          currentEpisode={currentEpisodeIndex !== -1 ? currentEpisodeIndex + 1 : 1}
          totalEpisodes={totalEpisodes}
          onPrev={() => currentEpisodeIndex > 0 && handleEpisodeChange(currentEpisodeIndex - 1)}
          onNext={() => currentEpisodeIndex < totalEpisodes - 1 && handleEpisodeChange(currentEpisodeIndex + 1)}
        />
      </div>

      {/* Episode List Sidebar */}
      {showEpisodeList && drama && (
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
              {drama.video_list.map((video, idx) => (
                <button
                  key={video.vid}
                  onClick={() => handleEpisodeChange(idx)}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                    ${idx === currentEpisodeIndex
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function HlsVideoPlayer({
  src,
  onEnded,
  className
}: {
  src: string;
  onEnded?: () => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    const isM3U8 = src.includes('.m3u8') || src.includes('application/vnd.apple.mpegurl') || src.includes('proxy');

    if (Hls.isSupported() && isM3U8) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log("Autoplay prevented:", e));
      });
    } else {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(e => console.log("Autoplay prevented:", e));
      });
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      className={className}
      onEnded={onEnded}
      playsInline
      autoPlay
    />
  );
}
