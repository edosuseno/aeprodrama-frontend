
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDramaWaveDetail, useDramaWaveStream } from "@/hooks/useDramaWave";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, List } from "lucide-react";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Hls from "hls.js";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

export default function DramaWaveWatchPage() {
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

    const { data: detailData, isLoading: loadingDetail } = useDramaWaveDetail(id || "");
    const { data: streamData, isLoading: loadingStream } = useDramaWaveStream(id || "", currentEpisode - 1);

    const { addToHistory } = useHistoryStore();

    // Catat ke History
    useEffect(() => {
        if (detailData && id) {
            addToHistory({
                id: id,
                title: detailData.shortPlayName,
                poster: detailData.cover,
                platform: "DramaWave",
                episodeNumber: currentEpisode,
                link: `/watch/dramawave/${id}?ep=${currentEpisode}`
            });
        }
    }, [id, currentEpisode, detailData, addToHistory]);

    const videoUrl = streamData?.url;

    const handleVideoEnded = useCallback(() => {
        if (!detailData) return;
        const total = detailData.episodes?.length || 0;
        if (currentEpisode < total) {
            const nextEp = currentEpisode + 1;
            setCurrentEpisode(nextEp);
            window.history.replaceState(null, '', `/watch/dramawave/${id}?ep=${nextEp}`);
        }
    }, [currentEpisode, detailData, id]);

    const addLog = (msg: string) => {
        console.log(`[DramaWave Player] ${msg}`);
    };

    useEffect(() => {
        if (videoUrl && videoRef.current) {
            const video = videoRef.current;
            // Gunakan API Route internal frontend sebagai proxy utama agar CORS aman di Vercel
            const proxiedUrl = `/api/proxy?url=${encodeURIComponent(videoUrl)}`;
            
            addLog(`Mencoba memutar via Proxy: ${proxiedUrl.substring(0, 50)}...`);

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
                video.src = proxiedUrl;
                video.addEventListener('loadedmetadata', () => {
                    video.play().catch((e) => addLog(`Autoplay Safari diblokir: ${e.message}`));
                });
            } else {
                video.src = proxiedUrl;
                video.play().catch((e) => addLog(`Gagal putar: ${e.message}`));
            }
        }
    }, [videoUrl]);

    // Force Trigger Native Subtitle (Sangat Penting untuk HLS & React)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const checkSubtitle = () => {
            if (video.textTracks) {
                const tracks = video.textTracks;
                for (let i = 0; i < tracks.length; i++) {
                    // Aktifkan track Indonesia
                    if (tracks[i].language === 'id' || tracks[i].kind === 'subtitles') {
                        tracks[i].mode = 'showing';
                    }
                }
            }
        };

        // Hapus track lama jika ada (mencegah duplikasi di browser)
        // const oldTracks = video.querySelectorAll('track');
        // oldTracks.forEach(t => t.remove());

        const timeout1 = setTimeout(checkSubtitle, 500);
        const timeout2 = setTimeout(checkSubtitle, 1500);

        return () => {
            clearTimeout(timeout1);
            clearTimeout(timeout2);
        };
    }, [currentEpisode, streamData]);

    const goToEpisode = (ep: number) => {
        setCurrentEpisode(ep);
        router.replace(`/watch/dramawave/${id}?ep=${ep}`, { scroll: false });
        setShowEpisodeList(false);
    };

    const totalEpisodes = detailData?.episodes?.length || 0;
    const dramaTitle = detailData?.shortPlayName || "Loading...";

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
            {/* Custom Subtitle Styling VIP - Ultra Force */}
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
                        href={`/detail/dramawave/${id}`}
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                        <div className="flex flex-col -gap-1">
                            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md leading-none">DRACINDO</span>
                            <span className="text-[10px] text-white/70 hidden sm:inline leading-none uppercase tracking-widest">PUSAT DRAMA</span>
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
                            <p className="text-white mb-4">Video tidak tersedia (VIP)</p>
                            <button
                                onClick={() => router.refresh()}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    )}

                    <video
                        key={currentEpisode}
                        ref={videoRef}
                        className={`w-full h-full max-h-[100dvh] transition-all duration-300 ${isZoomed ? "object-cover" : "object-contain"}`} controlsList="nofullscreen"
                        controls
                        autoPlay
                        crossOrigin="anonymous"
                        playsInline
                        onEnded={handleVideoEnded}
                    >
                        {(streamData?.subtitle || (streamData?.subtitles && streamData.subtitles.length > 0)) && (
                            <track 
                                key={currentEpisode}
                                label="Indonesia"
                                kind="subtitles"
                                srcLang="id"
                                src={
                                    streamData.subtitle || 
                                    (streamData.subtitles?.find((s:any) => (s.lang || s.language || '').toLowerCase().includes('id'))?.url || "")
                                }
                                default
                            />
                        )}
                    </video>
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
        </main>
    );
}
