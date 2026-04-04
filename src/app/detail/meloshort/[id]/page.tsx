"use client";

import { useParams, useRouter } from "next/navigation";
import { useMeloShortDetail } from "@/hooks/useMeloShort";
import { UnifiedErrorDisplay } from "@/components/UnifiedErrorDisplay";
import { usePlatform } from "@/hooks/usePlatform";
import { Play, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getProxiedImage } from "@/lib/api-utils";

export default function MeloShortDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const router = useRouter();

    const { data: drama, isLoading, isError, refetch } = useMeloShortDetail(id || "");
    const { setPlatform } = usePlatform();

    const handleBack = () => {
        setPlatform("meloshort");
        router.push("/");
    };

    if (isLoading) {
        return <DetailSkeleton />;
    }

    if (isError || !drama) {
        return (
            <div className="min-h-screen pt-24 px-4 bg-background">
                <UnifiedErrorDisplay
                    title="Gagal Memuat Detail MeloShort"
                    message="Terjadi kesalahan saat mengambil informasi drama. Pastikan ID valid dan backend berjalan."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    // Proxy cover image for stability
    const proxiedCover = drama.cover ? getProxiedImage(drama.cover, 400) : null;

    return (
        <main className="min-h-screen pt-20 bg-background text-foreground">
            {/* Hero Section with Cover */}
            <div className="relative">
                {/* Background Blur */}
                <div className="absolute inset-0 overflow-hidden">
                    {proxiedCover && (
                        <img
                            src={proxiedCover}
                            alt=""
                            className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 py-8">
                    {/* Back Button */}
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Kembali</span>
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
                        {/* Cover */}
                        <div className="relative group">
                            {proxiedCover && (
                                <img
                                    src={proxiedCover}
                                    alt={drama.title}
                                    className="w-full max-w-[300px] mx-auto rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                                />
                            )}
                            {/* Overlay Play Button on Cover - Posisi merunduk ke bawah (pb-8) agar elegan */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8">
                                <Link
                                    href={`/watch/meloshort/${drama.id}?ep=1`}
                                    className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Tonton Sekarang
                                </Link>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold font-display gradient-text mb-4 leading-tight">
                                    {drama.title}
                                </h1>

                                {/* Stats */}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-indigo-400">
                                        <Play className="w-4 h-4 text-primary" />
                                        <span>{drama.totalEpisodes || drama.episodes?.length || 0} Episode</span>
                                    </div>
                                    <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                                        MeloShort Original
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="glass rounded-2xl p-6 border border-white/10">
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-indigo-500 rounded-full" />
                                    Sinopsis
                                </h3>
                                <div className="text-muted-foreground leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                                    {drama.description || "Nikmati drama pendek berkualitas tinggi dari platform MeloShort."}
                                </div>
                            </div>

                            {/* Watch Button */}
                            <Link
                                href={`/watch/meloshort/${drama.id}?ep=1`}
                                className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-primary-foreground transition-all hover:scale-105 shadow-xl hover:shadow-primary/20 bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Play className="w-6 h-6 fill-current" />
                                Mulai Menonton
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function DetailSkeleton() {
    return (
        <main className="min-h-screen pt-24 px-4 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
                    <Skeleton className="aspect-[2/3] w-full max-w-[300px] mx-auto rounded-2xl opacity-20" />
                    <div className="space-y-6">
                        <Skeleton className="h-12 w-3/4 bg-white/5" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-32 rounded-full bg-white/5" />
                            <Skeleton className="h-8 w-32 rounded-full bg-white/5" />
                        </div>
                        <Skeleton className="h-40 w-full rounded-2xl bg-white/5" />
                        <Skeleton className="h-14 w-56 rounded-full bg-white/5" />
                    </div>
                </div>
            </div>
        </main>
    );
}
