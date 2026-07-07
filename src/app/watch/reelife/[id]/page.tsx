"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useReelifeDetail, useReelifeStream } from "@/hooks/useReelife";
import { useHistoryStore } from "@/hooks/useHistory";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, List } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Hls from "hls.js";
import { cn } from "@/lib/utils";

export default function ReelifeWatchPage() {
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const id = params.id;
    const router = useRouter();

    const [currentEpisode, setCurrentEpisode] = useState(1);
    const [showEpisodeList, setShowEpisodeList] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const swipeContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ep = searchParams.get("ep");
        if (ep) {
            setCurrentEpisode(parseInt(ep) || 1);
        }
    }, [searchParams]);

    const { data: detailData, isLoading: loadingDetail, error: errorDetail } = useReelifeDetail(id || "");
    const { data: videoUrl, isLoading: loadingStream } = useReelifeStream(id || "", currentEpisode);
    const { addToHistory } = useHistoryStore();
    
    const queryClient = useQueryClient();
    const [nextVideoUrl, setNextVideoUrl] = useState<string | null>(null);

    // Prefetch the NEXT episode to make swiping more responsive
    useEffect(() => {
        let isMounted = true;
        if (detailData && currentEpisode < detailData.totalEpisodes) {
            const nextEp = currentEpisode + 1;
            if (id) {
                queryClient.prefetchQuery({
                    queryKey: ['reelife_watch', id, nextEp],
                    queryFn: async () => {
                        const res = await fetch(`/api/reelife/watch?id=${id}&episodeIndex=${nextEp}`);
                        const data = await res.json();
                        
                        if (isMounted && data) {
                            const payload = data.data || data;
                            const rawUrl = payload.url || payload.videoAddress;
                            if (rawUrl) {
                                let pUrl = rawUrl;
                                if (pUrl.startsWith("http") && !pUrl.includes("wolftv.online") && !pUrl.includes(".mp4")) {
                                    pUrl = `/api/proxy?url=${encodeURIComponent(pUrl)}&referer=${encodeURIComponent('https://vidrama.asia/')}`;
                                }
                                setNextVideoUrl(pUrl);
                            }
                        }
                        return data.data || data;
                    }
                });
            }
        } else {
            setNextVideoUrl(null);
        }
        return () => { isMounted = false; };
    }, [currentEpisode, detailData, id, queryClient]);

    const currentEpisodeData = useMemo(() => {
        return detailData?.episodes?.find(ep => ep.index === currentEpisode);
    }, [detailData, currentEpisode]);

    useEffect(() => {
        if (detailData && currentEpisode) {
            addToHistory({
                id: id || "",
                title: detailData.title || "Reelife Drama",
                poster: detailData.cover || "",
                platform: "Reelife",
                episodeNumber: currentEpisode,
                link: `/watch/reelife/${id}?ep=${currentEpisode}`
            });
        }
    }, [id, currentEpisode, detailData, addToHistory]);

    const handleVideoEnded = useCallback(() => {
        if (!detailData) return;
        if (currentEpisode < detailData.totalEpisodes) {
            const nextEp = currentEpisode + 1;
            goToEpisode(nextEp);
        }
    }, [currentEpisode, detailData, id]);

    const { processedVideoUrl, processedSubtitleUrl, rawVideoUrl } = useMemo(() => {
        const streamObj = typeof videoUrl === 'object' && videoUrl !== null ? (videoUrl as any) : null;
        const url = streamObj?.url || (typeof videoUrl === 'string' ? videoUrl : null) || (currentEpisodeData as any)?.videoAddress;
        const subUrl = streamObj?.subtitle || currentEpisodeData?.subtitle || "";

        if (!url) return { processedVideoUrl: "", processedSubtitleUrl: "", rawVideoUrl: "" };
        
        let pUrl = url;
        if (pUrl.startsWith("http") && !pUrl.includes("wolftv.online") && !pUrl.includes(".mp4")) {
            pUrl = `/api/proxy?url=${encodeURIComponent(pUrl)}&referer=${encodeURIComponent('https://vidrama.asia/')}`;
        }

        let pSub = subUrl;
        if (pSub && pSub.startsWith("http")) {
            if (!pSub.startsWith("/api/proxy") && !pSub.includes("vercel.app")) {
                const encodedSubUrl = encodeURIComponent(pSub);
                pSub = `/api/proxy?url=${encodedSubUrl}&referer=${encodeURIComponent('https://vidrama.asia/')}`;
            }
        }

        return { processedVideoUrl: pUrl, processedSubtitleUrl: pSub, rawVideoUrl: url };
    }, [videoUrl, currentEpisodeData]);

    useEffect(() => {
        if (processedVideoUrl && videoRef.current) {
            const video = videoRef.current;
            
            console.log(`[Reelife] Playing: ${processedVideoUrl.substring(0, 50)}...`);

            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            const isHlsUrl = processedVideoUrl.includes('.m3u8') || processedVideoUrl.includes('index.m3u8');

            if (isHlsUrl && Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                });
                hlsRef.current = hls;
                hls.loadSource(processedVideoUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => {});
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // iOS Native HLS: Use raw URL!
                video.src = typeof rawVideoUrl !== 'undefined' && rawVideoUrl ? rawVideoUrl : (typeof videoUrl !== 'undefined' && videoUrl ? videoUrl : processedVideoUrl);
                video.addEventListener('loadedmetadata', () => { video.play().catch(() => {}) });
            } else {
                video.src = processedVideoUrl;
                video.play().catch(() => {});
            }
        }
    }, [processedVideoUrl]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const checkSubtitle = () => {
            if (video.textTracks) {
                const tracks = video.textTracks;
                for (let i = 0; i < tracks.length; i++) {
                    if (tracks[i].language === 'id' || tracks[i].kind === 'subtitles') {
                        tracks[i].mode = 'showing';
                    }
                }
            }
        };

        const timeout1 = setTimeout(checkSubtitle, 500);
        const timeout2 = setTimeout(checkSubtitle, 2000);

        return () => {
            clearTimeout(timeout1);
            clearTimeout(timeout2);
        };
    }, [currentEpisode, processedSubtitleUrl]);


    const goToEpisode = (ep: number) => {
        if (ep === currentEpisode) return;
        setCurrentEpisode(ep);
        router.replace(`/watch/reelife/${id}?ep=${ep}`, { scroll: false });
        setShowEpisodeList(false);
    };

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
                const totalEps = detailData?.totalEpisodes || detailData?.episodes?.length || detailData?.chapterCount || 9999;
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
    }, [currentEpisode, detailData]);

    if (loadingDetail) {
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

    if (errorDetail || !detailData) {
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

    const totalEpisodes = detailData?.totalEpisodes || detailData?.episodes?.length || 0;
    const dramaTitle = detailData?.title || "Reelife Drama";

    return (
        <div className="fixed inset-0 bg-black flex flex-col">
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
                    font-family: "Roboto", -apple-system, sans-serif !important;
                    font-size: 1.15rem !important;
                    font-weight: 800 !important;
                }
                `
            }} />
            
            <div className="absolute top-0 left-0 right-0 z-50 h-16 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />

                <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
                    <Link
                        href={`/detail/reelife/${id}`}
                        className="flex items-center gap-3 p-2 bg-black/20 backdrop-blur rounded-full text-white hover:bg-white/20 transition"
                    >
                        <ChevronLeft className="w-6 h-6" />
                        <div className="flex flex-col -gap-1">
                            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md leading-none">DRACINDO</span>
                            <span className="text-[10px] text-white/70 hidden sm:inline leading-none">PUSAT DRAMA</span>
                        </div>
                    </Link>

                    <div className="text-center flex-1 px-4 min-w-0">
                        <h1 className="text-white font-bold truncate text-sm sm:text-base drop-shadow-md">
                            {dramaTitle}
                        </h1>
                        <p className="text-white/80 text-[10px] sm:text-xs drop-shadow-md uppercase tracking-widest">
                            Episode {currentEpisode} / {totalEpisodes}
                        </p>
                    </div>

                    <button
                        onClick={() => setShowEpisodeList(!showEpisodeList)}
                        className="p-2 bg-black/20 backdrop-blur rounded-full text-white hover:bg-white/20 transition"
                    >
                        <List className="w-6 h-6 drop-shadow-md" />
                    </button>
                </div>
            </div>

            <div ref={swipeContainerRef} className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                    {loadingStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <span className="text-white font-medium">Memuat episode...</span>
                        </div>
                    )}

                    {!videoUrl && !loadingStream && !loadingDetail && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-20">
                            <AlertCircle className="w-10 h-10 text-destructive mb-4" />
                            <p className="text-white font-medium mb-4">URL Video tidak ditemukan</p>
                            <button
                                onClick={() => router.refresh()}
                                className="px-6 py-2 bg-primary/20 text-primary rounded-lg font-medium hover:bg-primary/30 transition-colors"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    )}

                    <video
                        key={currentEpisode}
                        ref={videoRef}
                        className={cn("w-full h-full max-h-[100dvh] transition-all duration-300", isZoomed ? "object-cover" : "object-contain")}
                        controls
                        controlsList="nofullscreen"
                        autoPlay
                        playsInline
                        onEnded={handleVideoEnded}
                    >
                        {processedSubtitleUrl && (
                            <track 
                                key={currentEpisode}
                                label="Indonesia"
                                kind="subtitles"
                                srcLang="id"
                                src={processedSubtitleUrl}
                                default
                            />
                        )}
                    </video>
                </div>

                <div className={cn("absolute bottom-20 md:bottom-12 left-0 right-0 z-40 pointer-events-none flex justify-center pb-safe-area-bottom transition-opacity duration-300", isZoomed ? "opacity-0" : "opacity-100")}>
                    <div className="flex items-center gap-2 md:gap-6 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-full border border-white/10 shadow-lg transition-all scale-90 md:scale-100 origin-bottom">
                        <button
                            onClick={() => currentEpisode > 1 && goToEpisode(currentEpisode - 1)}
                            disabled={currentEpisode <= 1}
                            className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                        </button>

                        <span className="text-white font-medium text-xs md:text-sm tabular-nums min-w-[60px] md:min-w-[80px] text-center">
                            Ep {currentEpisode} / {totalEpisodes}
                        </span>

                        <button
                            onClick={() => currentEpisode < totalEpisodes && goToEpisode(currentEpisode + 1)}
                            disabled={currentEpisode >= totalEpisodes}
                            className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {showEpisodeList && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        onClick={() => setShowEpisodeList(false)}
                    />
                    <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900/95 backdrop-blur-xl z-[70] overflow-hidden border-l border-white/10 shadow-2xl animate-in slide-in-from-right flex flex-col">
                        <div className="p-4 border-b border-white/10 bg-zinc-900/50 z-10 flex items-center justify-between text-white">
                            <h2 className="font-bold">Daftar Episode</h2>
                            <button
                                onClick={() => setShowEpisodeList(false)}
                                className="p-1 text-white/70 hover:text-white"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 gap-2 content-start no-scrollbar">
                            {Array.from({ length: totalEpisodes }).map((_, i) => {
                                const epNum = i + 1;
                                return (
                                    <button
                                        key={`ep-item-${epNum}`}
                                        onClick={() => goToEpisode(epNum)}
                                        className={cn(
                                            "aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all shadow-sm",
                                            epNum === currentEpisode
                                                ? "bg-red-600 text-white shadow-lg"
                                                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {epNum}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Hidden Preloader for the Next Episode */}
            {nextVideoUrl && (
                <>
                    {/* Preload manifest untuk iOS / Safari */}
                    <link rel="preload" href={nextVideoUrl} as="fetch" crossOrigin="anonymous" />
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
