"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDrmanovaDetail, useDrmanovaStream } from "@/hooks/useDrmanova";
import { useHistoryStore } from "@/hooks/useHistory";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, List } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Hls from "hls.js";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";

export default function DrmanovaWatchPage() {
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

    const { data: detailData, isLoading: loadingDetail } = useDrmanovaDetail(id || "");
    const { data: streamData, isLoading: loadingStream, error: errorStream } = useDrmanovaStream(id || "", currentEpisode);
    const videoUrl = streamData?.url || streamData?.videoUrl || streamData?.streamUrl;
    const { addToHistory } = useHistoryStore();

    useEffect(() => {
        if (detailData && currentEpisode) {
            addToHistory({
                id: id || "",
                title: detailData.title || "DramaNova",
                poster: detailData.cover || "",
                platform: "dramanova",
                episodeNumber: currentEpisode,
                link: `/watch/dramanova/${id}?ep=${currentEpisode}`
            });
        }
    }, [id, currentEpisode, detailData, addToHistory]);

    const handleVideoEnded = useCallback(() => {
        if (!detailData) return;
        const total = detailData.episodes?.length || 0;
        if (currentEpisode < total) {
            const nextEp = currentEpisode + 1;
            goToEpisode(nextEp);
        }
    }, [currentEpisode, detailData, id]);

    const addLog = (msg: string) => {
        console.log(`[Dramanova Player] ${msg}`);
    };

    useEffect(() => {
        if (videoUrl && videoRef.current) {
            const video = videoRef.current;
            // Gunakan API Route internal frontend sebagai proxy utama agar CORS aman di Vercel
            // Untuk Dramanova (Sansekai/HikeUniverses), referer www.vidrama.asia sangat krusial
            const proxiedUrl = `/api/proxy?url=${encodeURIComponent(videoUrl)}&referer=${encodeURIComponent('https://www.vidrama.asia/')}`;
            
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
    }, [currentEpisode, streamData]);

    const goToEpisode = (ep: number) => {
        setCurrentEpisode(ep);
        router.replace(`/watch/dramanova/${id}?ep=${ep}`, { scroll: false });
        setShowEpisodeList(false);
    };

    const totalEpisodes = detailData?.episodes?.length || 0;
    const dramaTitle = detailData?.title || "Loading...";

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
    }, [currentEpisode, totalEpisodes]);

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

            <div className="absolute top-0 left-0 right-0 z-50 h-16 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
                <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
                    <Link
                        href={`/detail/dramanova/${id}`}
                        className="flex items-center gap-3 p-2 bg-black/20 backdrop-blur rounded-full text-white hover:bg-white/20 transition"
                    >
                        <ChevronLeft className="w-6 h-6" />
                        <div className="flex flex-col -gap-1">
                            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md leading-none">AE PRO</span>
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
                    {(loadingDetail || loadingStream) && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                    )}

                    {!videoUrl && !loadingStream && !loadingDetail && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-20">
                            <AlertCircle className="w-10 h-10 text-destructive mb-4" />
                            <p className="text-white mb-4">Video tidak tersedia</p>
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
                        className="w-full h-full object-contain max-h-[100dvh]"
                        controls
                        autoPlay
                        crossOrigin="anonymous"
                        playsInline
                        onEnded={handleVideoEnded}
                    >
                        {streamData?.subtitles?.find((sub: any) => sub.label === 'Indonesia' || sub.language === 'id-ID' || sub.language === 'id' || sub.language === 'in') && (
                            <track 
                                key={currentEpisode}
                                label="Indonesia"
                                kind="subtitles"
                                srcLang="id"
                                src={`/api/proxy?url=${encodeURIComponent(streamData.subtitles.find((sub: any) => sub.label === 'Indonesia' || sub.language === 'id-ID' || sub.language === 'id' || sub.language === 'in')?.url || "")}&referer=${encodeURIComponent('https://www.vidrama.asia/')}&t=${Date.now()}`}
                                default
                            />
                        )}
                    </video>
                </div>

                <UnifiedVideoNavigation
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
                    <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900/95 backdrop-blur-xl z-[70] overflow-hidden border-l border-white/10 shadow-2xl animate-in slide-in-from-right flex flex-col">
                        <div className="p-4 border-b border-white/10 bg-zinc-900/50 z-10 flex items-center justify-between text-white">
                            <h2 className="font-bold">Daftar Episode</h2>
                            <button onClick={() => setShowEpisodeList(false)} className="p-1 text-white/70 hover:text-white">
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
                                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all shadow-sm ${epNum === currentEpisode ? "bg-red-600 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
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
