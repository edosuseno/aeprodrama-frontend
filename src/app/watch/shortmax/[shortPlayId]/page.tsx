"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useShortMaxDetail, useShortMaxEpisode } from "@/hooks/useShortMax";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, List } from "lucide-react";
import { useHistoryStore } from "@/hooks/useHistory";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Hls from "hls.js";
import { UnifiedVideoNavigation } from "@/components/UnifiedVideoNavigation";
import { getBackendBase } from "@/lib/api-utils";

export default function ShortMaxWatchPage() {
    const params = useParams<{ shortPlayId: string }>();
    const searchParams = useSearchParams();
    const shortPlayId = params.shortPlayId;
    const router = useRouter();

    const [currentEpisode, setCurrentEpisode] = useState(1);
    const [showEpisodeList, setShowEpisodeList] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    // Ref untuk area swipe vertikal (mobile)
    const swipeContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ep = searchParams.get("ep");
        if (ep) {
            setCurrentEpisode(parseInt(ep) || 1);
        }
    }, [searchParams]);

    const { data: detailData, isLoading: loadingDetail } = useShortMaxDetail(shortPlayId || "");
    const { data: episodeData, isLoading: loadingEpisode, error: errorEpisode } = useShortMaxEpisode(shortPlayId || "", currentEpisode);

    const { addToHistory } = useHistoryStore();

    // Catat ke History
    useEffect(() => {
        if (detailData && shortPlayId) {
            addToHistory({
                id: String(shortPlayId),
                title: detailData.title,
                poster: detailData.cover,
                platform: "ShortMax",
                episodeNumber: currentEpisode,
                link: `/watch/shortmax/${shortPlayId}?ep=${currentEpisode}`
            });
        }
    }, [shortPlayId, currentEpisode, detailData, addToHistory]);

    const handleVideoEnded = useCallback(() => {
        if (!detailData) return;
        const total = detailData.totalEpisodes;
        if (currentEpisode < total) {
            const nextEp = currentEpisode + 1;
            setCurrentEpisode(nextEp);
            window.history.replaceState(null, '', `/watch/shortmax/${shortPlayId}?ep=${nextEp}`);
        }
    }, [currentEpisode, detailData, shortPlayId]);

    const addLog = (msg: string) => {
        console.log(`[ShortMax Player] ${msg}`);
    };
// Konversi URL video ke proxy Backend untuk mencegah HLS.js decryption errors
    const buildProxyUrl = (videoUrl: string): string => {
        // Jika sudah berupa link proxy/decrypt sansekai, gunakan langsung
        if (videoUrl.includes('/api/shortmax/hls') || videoUrl.includes('/api/shortmax/proxy') || videoUrl.includes('/api/proxy') || videoUrl.includes('/api/dramabox/decrypt') || videoUrl.includes('sansekai.my.id')) {
            return videoUrl;
        }

        const backendUrl = getBackendBase();
        const baseUrl = backendUrl.endsWith('/api') ? backendUrl.replace('/api', '') : backendUrl;
        return `${baseUrl}/api/shortmax/proxy?url=${encodeURIComponent(videoUrl)}`;
    };

    useEffect(() => {
        // BUG #4 Fix: fallback ke episodeData.url jika episode.videoUrl tidak ada
        const resolvedVideoUrl = episodeData?.episode?.videoUrl || (episodeData as any)?.url;
        if (resolvedVideoUrl && videoRef.current) {
            const video = videoRef.current;
            const rawVideoUrl = resolvedVideoUrl;

            addLog(`URL Asli: ${rawVideoUrl}`);

            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            // Deteksi format
            const isHlsUrl = rawVideoUrl.includes('.m3u8') || rawVideoUrl.includes('application/x-mpegURL');

            if (isHlsUrl && Hls.isSupported()) {
                // Proxy URL agar tidak kena CORS dari akamai
                const proxyUrl = buildProxyUrl(rawVideoUrl);
                addLog(`HLS via proxy: ${proxyUrl}`);
                const hls = new Hls({
                    enableWorker: false,
                    fragLoadingMaxRetry: 3,
                    manifestLoadingMaxRetry: 3,
                    levelLoadingMaxRetry: 3,
                    xhrSetup: (xhr) => {
                        xhr.withCredentials = false;
                    }
                });
                hlsRef.current = hls;
                hls.loadSource(proxyUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    addLog("Manifest HLS dimuat, mulai memutar.");
                    video.play().catch((e) => addLog(`Autoplay diblokir: ${e.message}`));
                });

                // --- FIX SHORTMAX: FRONTEND TRIMMING (METODE VIDRAMA ASIA) ---
                // Kita memotong header sampah di browser agar tidak merusak HTTP Range/Size di backend.
                hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
                    try {
                        if (data.payload && data.payload.byteLength > 2168) {
                            const uint8 = new Uint8Array(data.payload);
                            // Cek signature "shortmax" (73 68 6f 72)
                            if (uint8[0] === 0x73 && uint8[1] === 0x68 && uint8[2] === 0x6f && uint8[3] === 0x72) {
                                data.payload = data.payload.slice(2168);
                                // addLog("Berhasil memotong header sampah 2168 byte di frontend.");
                            }
                        }
                    } catch (e) {
                        console.error("Gagal melakukan trimming fragmen:", e);
                    }
                });

                hls.on(Hls.Events.ERROR, (_, data) => {
                    addLog(`HLS Error [${data.type}]: ${data.details}`);
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                addLog("Network error fatal, mencoba recover...");
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                addLog("Media error fatal, mencoba recover...");
                                hls.recoverMediaError();
                                break;
                            default:
                                addLog("HLS Fatal Error tidak tertangani, menghentikan.");
                                hls.destroy();
                                break;
                        }
                    } else if (data.details === 'fragParsingError') {
                        // Jika parsing error tapi tidak fatal (muncul di log), coba recover
                        hls.recoverMediaError();
                    }
                });
            } else if (isHlsUrl && (video as any).canPlayType('application/vnd.apple.mpegurl')) {
                // Safari: native HLS via proxy
                const proxyUrl = buildProxyUrl(rawVideoUrl);
                addLog(`HLS native Safari via proxy: ${proxyUrl}`);
                video.src = proxyUrl;
                video.load();
                video.play().catch((e) => addLog(`Gagal putar native HLS: ${e.message}`));
            } else {
                addLog(`Format MP4/langsung: ${rawVideoUrl}`);
                video.src = rawVideoUrl;
                video.load();
                video.play().catch((e) => addLog(`Gagal putar: ${e.message}`));
            }
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [episodeData]);

    // Auto-fullscreen pada mobile saat video mulai diputar (dinonaktifkan)
    // useEffect(() => {
    //     const video = videoRef.current;
    //     if (!video) return;
    //     const handlePlay = () => {
    //         if (window.innerWidth < 768 && video.requestFullscreen) {
    //             video.requestFullscreen().catch(() => {
    //                 if ((video as any).webkitEnterFullscreen) {
    //                     (video as any).webkitEnterFullscreen();
    //                 }
    //             });
    //         }
    //     };
    //     video.addEventListener('play', handlePlay);
    //     return () => video.removeEventListener('play', handlePlay);
    // }, []);

    const goToEpisode = (ep: number) => {
        setCurrentEpisode(ep);
        router.replace(`/watch/shortmax/${shortPlayId}?ep=${ep}`, { scroll: false });
        setShowEpisodeList(false);
    };

    const totalEpisodes = detailData?.totalEpisodes || 0;
    const dramaTitle = detailData?.title || "Loading...";

    // Swipe vertikal untuk navigasi episode di mobile
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
                        href={`/detail/shortmax/${shortPlayId}`}
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
                    {(loadingDetail || loadingEpisode) && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                    )}

                    {errorEpisode && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-20">
                            <AlertCircle className="w-10 h-10 text-destructive mb-4" />
                            <p className="text-white mb-4">Gagal memuat video</p>
                            <button
                                onClick={() => router.refresh()}
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
                                        className={`
                      aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                      ${epNum === currentEpisode
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                            }
                    `}
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
