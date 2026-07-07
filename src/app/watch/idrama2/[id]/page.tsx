"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useIdrama2Detail } from "@/hooks/useIdrama2";
import { useHistoryStore } from "@/hooks/useHistory";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, List } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Hls from "hls.js";
import { fetchJson } from "@/lib/fetcher";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

export default function Idrama2WatchPage() {
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const id = params.id;
    const router = useRouter();

    const [currentEpisode, setCurrentEpisode] = useState(1);
    const [showEpisodeList, setShowEpisodeList] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loadingStream, setLoadingStream] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [nextVideoUrl, setNextVideoUrl] = useState<string | null>(null);

    const swipeContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ep = searchParams.get("ep");
        if (ep) {
            setCurrentEpisode(parseInt(ep) || 1);
        }
    }, [searchParams]);

    const { data: detailData, isLoading: loadingDetail } = useIdrama2Detail(id || "");
    const { addToHistory } = useHistoryStore();

    useEffect(() => {
        if (detailData && currentEpisode) {
            addToHistory({
                id: id || "",
                title: detailData.title || "iDrama",
                poster: detailData.cover || "",
                platform: "idrama2",
                episodeNumber: currentEpisode,
                link: `/watch/idrama2/${id}?ep=${currentEpisode}`
            });
        }
    }, [id, currentEpisode, detailData, addToHistory]);

    const episodes = detailData?.episodes || [];
    
    // Fetch stream explicitly since detail doesn't include videoUrl for idrama2
    useEffect(() => {
        const fetchStream = async () => {
            if (!id || !currentEpisode) return;
            setLoadingStream(true);
            setStreamError(null);
            setVideoUrl(null);
            try {
                // Find episode ID based on currentEpisode index
                const epData = episodes.find(e => e.index === currentEpisode || e.id == currentEpisode);
                const epIdToFetch = epData ? epData.id : currentEpisode;

                const data = await fetchJson<any>(`/api/idrama2/stream/${id}/${epIdToFetch}`);
                
                if (data && data.url) {
                    setVideoUrl(data.url);
                } else {
                    setStreamError("Video tidak tersedia (VIP/Terkunci)");
                }
            } catch (err) {
                setStreamError("Gagal memuat video");
            } finally {
                setLoadingStream(false);
            }
        };

        if (episodes.length > 0) {
            fetchStream();
        }
    }, [id, currentEpisode, episodes]);

    // Prefetch the NEXT episode to make swiping more responsive
    useEffect(() => {
        let isMounted = true;
        const total = detailData?.totalEpisodes || episodes.length;
        if (id && episodes.length > 0 && currentEpisode < total) {
            const nextEp = currentEpisode + 1;
            const epData = episodes.find(e => e.index === nextEp || e.id == nextEp);
            const epIdToFetch = epData ? epData.id : nextEp;

            const fetchNextStream = async () => {
                try {
                    const res = await fetch(`/api/idrama2/stream/${id}/${epIdToFetch}`);
                    const data = await res.json();
                    
                    if (isMounted && data && data.url) {
                        setNextVideoUrl(data.url);
                    } else if (isMounted) {
                        setNextVideoUrl(null);
                    }
                } catch (e) {
                    if (isMounted) setNextVideoUrl(null);
                }
            };
            fetchNextStream();
        } else {
            setNextVideoUrl(null);
        }
        return () => { isMounted = false; };
    }, [id, currentEpisode, episodes, detailData]);

    const handleVideoEnded = useCallback(() => {
        if (!detailData) return;
        const total = detailData.totalEpisodes || episodes.length;
        if (currentEpisode < total) {
            const nextEp = currentEpisode + 1;
            setCurrentEpisode(nextEp);
            window.history.replaceState(null, '', `/watch/idrama2/${id}?ep=${nextEp}`);
        }
    }, [currentEpisode, detailData, id, episodes.length]);

    const addLog = (msg: string) => {
        console.log(`[iDrama Player] ${msg}`);
    };

    useEffect(() => {
        if (videoUrl && videoRef.current) {
            const video = videoRef.current;
            addLog(`Mencoba memutar: ${videoUrl}`);

            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            const isHlsUrl = videoUrl.includes('.m3u8');

            if (isHlsUrl && Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    fragLoadingMaxRetry: 3,
                });
                hlsRef.current = hls;
                hls.loadSource(videoUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch((e) => addLog(`Autoplay diblokir: ${e.message}`));
                });
                hls.on(Hls.Events.ERROR, (_, data) => {
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
                                break;
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = videoUrl;
                video.addEventListener('loadedmetadata', () => {
                    video.play().catch((e) => addLog(`Autoplay Safari diblokir: ${e.message}`));
                });
            } else {
                video.src = videoUrl;
                video.play().catch((e) => addLog(`Gagal putar: ${e.message}`));
            }
        }
    }, [videoUrl]);

    const goToEpisode = (ep: number) => {
        setCurrentEpisode(ep);
        router.replace(`/watch/idrama2/${id}?ep=${ep}`, { scroll: false });
        setShowEpisodeList(false);
    };

    const totalEpisodes = detailData?.totalEpisodes || episodes.length || 0;
    const dramaTitle = detailData?.title || "Loading...";

    // Swipe vertikal (mobile)
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

    return (
        <main className="fixed inset-0 bg-black flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
                <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
                    <Link
                        href={`/detail/idrama2/${id}`}
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                        <div className="flex flex-col -gap-1">
                            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md leading-none">DRACINDO</span>
                            <span className="text-[10px] text-white/70 hidden sm:inline leading-none uppercase tracking-tighter">Pusat Drama</span>
                        </div>
                    </Link>

                    <div className="text-center flex-1 px-4 min-w-0">
                        <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">
                            {dramaTitle}
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

            <div ref={swipeContainerRef} className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                    {(loadingDetail || loadingStream) && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                    )}

                    {!videoUrl && !loadingDetail && !loadingStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-20">
                            <AlertCircle className="w-10 h-10 text-destructive mb-4" />
                            <p className="text-white mb-4">{streamError || "Video tidak tersedia"}</p>
                            <button
                                onClick={() => window.location.reload()}
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
                        autoPlay
                        playsInline
                        onEnded={handleVideoEnded}
                    />
                </div>

                <UnifiedVideoNavigation isHidden={isZoomed}
                    currentEpisode={currentEpisode}
                    totalEpisodes={totalEpisodes}
                    onPrev={() => currentEpisode > 1 && goToEpisode(currentEpisode - 1)}
                    onNext={() => currentEpisode < totalEpisodes && goToEpisode(currentEpisode + 1)}
                />
            </div>

            {showEpisodeList && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        onClick={() => setShowEpisodeList(false)}
                    />
                    <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900 z-[70] overflow-y-auto border-l border-white/10 shadow-2xl animate-in slide-in-from-right">
                        <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 flex items-center justify-between">
                            <h2 className="font-bold text-white">Daftar Episode</h2>
                            <button onClick={() => setShowEpisodeList(false)} className="p-1 text-white/70 hover:text-white">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-3 grid grid-cols-5 gap-2">
                            {Array.from({ length: totalEpisodes }).map((_, i) => {
                                const epNum = i + 1;
                                return (
                                    <button
                                        key={epNum}
                                        onClick={() => goToEpisode(epNum)}
                                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${epNum === currentEpisode ? "bg-primary text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
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
        </main>
    );
}
