"use client";

import { use, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMovieBoxSources, useMovieBoxDetail } from "@/hooks/useMovieBox";
import { Loader2, ArrowLeft, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function MovieBoxWatchPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const searchParams = useSearchParams();
    const router = useRouter();
    const episodeId = searchParams.get("episodeId") || undefined;

    const { data: detailData } = useMovieBoxDetail(resolvedParams.id);
    const { data: sourcesData, isLoading, isError } = useMovieBoxSources(resolvedParams.id, episodeId);

    const [iframeLoading, setIframeLoading] = useState(true);
    const [loadTime, setLoadTime] = useState(0);
    const [startTime] = useState(Date.now());

    const title = detailData?.data?.title || "MovieBox";
    const subTitle = episodeId ? `Episode ${episodeId}` : "Full Movie";
    const embedUrl = sourcesData?.data?.[0]?.url;

    // Monitor iframe load time
    useEffect(() => {
        if (!iframeLoading) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            setLoadTime(parseFloat(elapsed));
        }
    }, [iframeLoading, startTime]);

    const handleIframeLoad = () => {
        // Add small delay for smooth transition
        setTimeout(() => {
            setIframeLoading(false);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-transparent">
            {/* Header */}
            <div className="sticky top-0 z-20 glass-strong border-b border-white/5">
                <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10">
                    <div className="flex items-center gap-4 h-16">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-white font-bold text-lg truncate">{title}</h1>
                            <p className="text-white/60 text-xs font-medium truncate">{subTitle}</p>
                        </div>
                        {!iframeLoading && loadTime > 0 && (
                            <div className="hidden md:flex items-center gap-2 text-sm text-primary">
                                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                <span>Direct Connection Stable</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <span className="text-white font-medium">Buka Koneksi Video...</span>
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <Card className="p-8 glass-strong border-red-500/30">
                        <div className="text-center space-y-4">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                            <h3 className="text-white font-bold text-lg">Gagal Memuat Video</h3>
                            <p className="text-white/70">Terjadi kesalahan saat mengambil sumber video.</p>
                            <Button onClick={() => window.location.reload()}>
                                Coba Lagi
                            </Button>
                        </div>
                    </Card>
                )}

                {/* No Sources */}
                {!isLoading && !isError && (!sourcesData?.data || sourcesData.data.length === 0) && (
                    <Card className="p-8 glass-strong border-yellow-500/30">
                        <div className="text-center space-y-4">
                            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
                            <h3 className="text-white font-bold text-lg">Sumber Video Tidak Tersedia</h3>
                            <p className="text-white/70">Maaf, video ini belum tersedia untuk ditonton.</p>
                        </div>
                    </Card>
                )}

                {/* Player */}
                {!isLoading && embedUrl && (
                    <div className="space-y-6">
                        {/* Info Banner */}
                        <Card className="p-4 glass border-primary/20">
                            <div className="flex items-center gap-3">
                                <Info className="w-5 h-5 text-primary flex-shrink-0" />
                                <p className="text-white/70 text-sm">
                                    <strong className="text-primary">Premium Player</strong> - Resolusi video akan otomatis menyesuaikan dengan koneksi internet Anda.
                                    Gunakan mode layar penuh untuk kualitas terbaik.
                                </p>
                            </div>
                        </Card>

                        {/* Video Player Container */}
                        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/5">
                            {/* Loading Overlay */}
                            {iframeLoading && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95">
                                    <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                                    <p className="mt-4 text-white font-medium">Menjangkau Server Video...</p>
                                    <p className="mt-2 text-white/40 text-sm">Harap tunggu beberapa saat</p>
                                </div>
                            )}

                            {/* Main Iframe */}
                            <iframe
                                src={embedUrl}
                                className="w-full h-full"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                onLoad={handleIframeLoad}
                                title={title}
                            />
                        </div>

                        {/* Movie Info */}
                        {detailData?.data && (
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Poster */}
                                {detailData.data.poster && (
                                    <div className="md:col-span-1">
                                        <img
                                            src={detailData.data.poster}
                                            alt={title}
                                            className="w-full rounded-lg shadow-xl"
                                        />
                                    </div>
                                )}

                                {/* Info */}
                                <div className={`${detailData.data.poster ? 'md:col-span-2' : 'md:col-span-3'} space-y-4`}>
                                    <h2 className="text-white text-3xl font-bold">{title}</h2>

                                    {detailData.data.tagline && (
                                        <p className="text-purple-400 italic text-lg">"{detailData.data.tagline}"</p>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-sm">
                                        {detailData.data.year && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/50">📅</span>
                                                <span className="text-white">{detailData.data.year}</span>
                                            </div>
                                        )}
                                        {detailData.data.duration && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/50">⏱️</span>
                                                <span className="text-white">{detailData.data.duration}</span>
                                            </div>
                                        )}
                                        {detailData.data.rating && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-yellow-400">⭐</span>
                                                <span className="text-white">{detailData.data.rating}/10</span>
                                            </div>
                                        )}
                                    </div>

                                    {detailData.data.genre && detailData.data.genre.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {detailData.data.genre.map((g: string, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-300"
                                                >
                                                    {g}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {detailData.data.synopsis && (
                                        <div>
                                            <h3 className="text-white font-semibold mb-2">Synopsis</h3>
                                            <p className="text-white/70 leading-relaxed">{detailData.data.synopsis}</p>
                                        </div>
                                    )}

                                    {detailData.data.director && (
                                        <div>
                                            <h3 className="text-white font-semibold mb-1">Director</h3>
                                            <p className="text-white/70">{detailData.data.director}</p>
                                        </div>
                                    )}

                                    {detailData.data.cast && detailData.data.cast.length > 0 && (
                                        <div>
                                            <h3 className="text-white font-semibold mb-2">Cast</h3>
                                            <p className="text-white/70">{detailData.data.cast.join(', ')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tips */}
                        <Card className="p-4 bg-white/5 border-white/10">
                            <p className="text-white/50 text-xs text-center">
                                💡 <strong>Tips:</strong> Klik tombol fullscreen (⛶) di player untuk pengalaman terbaik.
                                Jika video tidak muncul, coba refresh halaman atau gunakan browser Chrome/Firefox.
                            </p>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
