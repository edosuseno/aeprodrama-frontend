"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useVeloloDetail, useVeloloStream } from "@/hooks/useVelolo";
import { useHistoryStore } from "@/hooks/useHistory";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, List } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Hls from "hls.js";
import { cn } from "@/lib/utils";

export default function VeloloWatchPage() {
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const id = params.id;
    const router = useRouter();

    const [currentEpisode, setCurrentEpisode] = useState(1);
    const [showEpisodeList, setShowEpisodeList] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const swipeContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ep = searchParams.get("ep");
        if (ep) {
            setCurrentEpisode(parseInt(ep) || 1);
        }
    }, [searchParams]);

    const { data: detailData, isLoading: loadingDetail, error: errorDetail } = useVeloloDetail(id || "");
    const { data: videoUrl, isLoading: loadingStream } = useVeloloStream(id || "", currentEpisode);
    const { addToHistory } = useHistoryStore();

    // Simpan ke Riwayat Nonton
    useEffect(() => {
        if (detailData && currentEpisode) {
            addToHistory({
                id: id || "",
                title: detailData.title || "Velolo Drama",
                poster: detailData.cover || "",
                platform: "velolo",
                episodeNumber: currentEpisode,
                link: `/watch/velolo/${id}?ep=${currentEpisode}`
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

    useEffect(() => {
        if (videoUrl && videoRef.current) {
            const video = videoRef.current;
            
            // Gunakan Universal Proxy untuk menghindari CORS
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
            const proxiedUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(videoUrl)}`;
            
            console.log(`[Velolo] Playing via Proxy: ${proxiedUrl.substring(0, 50)}...`);

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
                hls.loadSource(proxiedUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => console.log("Autoplay blocked"));
                });
            } else {
                video.src = proxiedUrl;
                video.play().catch(() => console.log("Play blocked"));
            }
        }
    }, [videoUrl]);

    // Force Trigger Native Subtitle (Sangat Penting untuk HLS & React)
    useEffect(() => {
        const checkSubtitle = () => {
            if (videoRef.current && videoRef.current.textTracks) {
                const tracks = videoRef.current.textTracks;
                for (let i = 0; i < tracks.length; i++) {
                    if (tracks[i].language === 'id' || tracks[i].kind === 'subtitles') {
                        tracks[i].mode = 'showing';
                    }
                }
            }
        };

        const timeout1 = setTimeout(checkSubtitle, 500);
        const timeout2 = setTimeout(checkSubtitle, 1500);

        return () => {
            clearTimeout(timeout1);
            clearTimeout(timeout2);
        };
    }, [currentEpisode, detailData]);

    const goToEpisode = (ep: number) => {
        if (ep === currentEpisode) return;
        setCurrentEpisode(ep);
        router.replace(`/watch/velolo/${id}?ep=${ep}`, { scroll: false });
        setShowEpisodeList(false);
    };

    // Auto-fullscreen pada mobile
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => {
            if (window.innerWidth < 768 && video.requestFullscreen) {
                video.requestFullscreen().catch(() => {
                    if ((video as any).webkitEnterFullscreen) {
                        (video as any).webkitEnterFullscreen();
                    }
                });
            }
        };

        video.addEventListener('play', handlePlay);
        return () => video.removeEventListener('play', handlePlay);
    }, []);

    // Swipe vertikal (mobile)
    useEffect(() => {
        const el = swipeContainerRef.current;
        if (!el) return;
        let touchStartY = 0;
        const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
        const handleTouchEnd = (e: TouchEvent) => {
            if (window.innerWidth >= 768) return;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaY = touchStartY - touchEndY;
            if (deltaY > 80 && currentEpisode < totalEpisodes) goToEpisode(currentEpisode + 1);
            else if (deltaY < -80 && currentEpisode > 1) goToEpisode(currentEpisode - 1);
        };
        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });
        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
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
    const dramaTitle = detailData?.title || "Velolo Drama";

    return (
        <div className="fixed inset-0 bg-black flex flex-col">
            {/* Custom Subtitle Styling VIP - Ultra Force */}
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
                ::cue(c), ::cue(b), ::cue(v), ::cue(u), ::cue(i) {
                    color: #fff !important;
                    background: transparent !important;
                    background-color: rgba(0,0,0,0) !important;
                }
                `
            }} />
            
            {/* Header - Fixed Overlay (Seragam dengan FreeReels/Melolo) */}
            <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />

                <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
                    <Link
                        href={`/detail/velolo/${id}`}
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
                            {dramaTitle}
                        </h1>
                        <p className="text-white/80 text-xs drop-shadow-md">
                            Episode {currentEpisode}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
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
                        className="w-full h-full object-contain max-h-[100dvh]"
                        controls
                        autoPlay
                        playsInline
                        crossOrigin="anonymous"
                        onEnded={handleVideoEnded}
                    >
                        {detailData?.episodes?.find(ep => ep.index === currentEpisode)?.subtitle && (
                            <track 
                                key={currentEpisode}
                                label="Indonesia"
                                kind="subtitles"
                                srcLang="id"
                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/proxy?url=${encodeURIComponent(detailData.episodes.find(ep => ep.index === currentEpisode)?.subtitle || "")}&t=${Date.now()}`}
                                default
                            />
                        )}
                    </video>
                </div>

                {/* Navigation Controls Overlay - Bottom (Seragam dengan FreeReels/Melolo) */}
                <div className="absolute bottom-20 md:bottom-12 left-0 right-0 z-40 pointer-events-none flex justify-center pb-safe-area-bottom">
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

            {/* Episode List Sidebar (Seragam dengan FreeReels/Melolo) */}
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
                            {Array.from({ length: totalEpisodes }).map((_, i) => {
                                const epNum = i + 1;
                                return (
                                    <button
                                        key={epNum}
                                        onClick={() => goToEpisode(epNum)}
                                        className={cn(
                                            "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all",
                                            epNum === currentEpisode
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
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
        </div>
    );
}
