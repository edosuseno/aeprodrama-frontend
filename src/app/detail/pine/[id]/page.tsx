"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePineDetail } from "@/hooks/usePine";
import { UnifiedErrorDisplay } from "@/components/UnifiedErrorDisplay";
import { usePlatform } from "@/hooks/usePlatform";
import { Play, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getProxiedImage } from "@/lib/api-utils";

export default function PineDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const searchParams = useSearchParams();
    const router = useRouter();

    const { data: drama, isLoading, isError, refetch } = usePineDetail(id || "");
    const { setPlatform } = usePlatform();

    const handleBack = () => {
        setPlatform("pine");
        router.push("/explore/pine");
    };

    if (isLoading) {
        return <DetailSkeleton />;
    }

    if (isError || !drama) {
        return (
            <div className="min-h-screen pt-24 px-4 bg-background">
                <UnifiedErrorDisplay
                    title="Gagal Memuat Detail Pine"
                    message="Terjadi kesalahan saat mengambil informasi drama. Pastikan ID valid."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const fallbackCover = searchParams.get('cover');
    const fallbackCategories = searchParams.get('cat');

    const finalCover = drama.cover || drama.image || fallbackCover || "";
    const finalCategories = drama.categories || fallbackCategories || "";

    const proxiedCover = finalCover ? getProxiedImage(finalCover, 400) : null;

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
                    <button 
                        onClick={handleBack}
                        className="mb-6 flex items-center text-muted-foreground hover:text-foreground transition"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Kembali
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
                        {/* Cover Image */}
                        <div className="relative group mx-auto md:mx-0 w-full max-w-[300px]">
                            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl relative">
                                {proxiedCover ? (
                                    <img
                                        src={proxiedCover}
                                        alt={drama.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <span className="text-muted-foreground">No Image</span>
                                    </div>
                                )}
                                {/* Overlay Play Button on Cover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8">
                                    <Link
                                        href={`/watch/pine/${id}?ep=1&cover=${encodeURIComponent(finalCover)}&cat=${encodeURIComponent(finalCategories)}`}
                                        className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        Tonton Sekarang
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold font-display gradient-text mb-4 leading-tight">
                                    {drama.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-indigo-400 font-bold uppercase tracking-wider text-[10px]">Pine</span>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-indigo-400">
                                        <Play className="w-4 h-4 text-primary" />
                                        <span>{drama.totalEpisodes} Episode</span>
                                    </div>
                                    {finalCategories && (
                                        <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/80 text-xs">
                                            {finalCategories}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6 border border-white/10">
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-indigo-500 rounded-full" />
                                    Sinopsis
                                </h3>
                                <div className="text-muted-foreground leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                                    {drama.description || "Tidak ada sinopsis yang tersedia."}
                                </div>
                            </div>

                            <div className="pt-2">
                                <Link 
                                    href={`/watch/pine/${id}?ep=1&cover=${encodeURIComponent(finalCover)}&cat=${encodeURIComponent(finalCategories)}`}
                                    className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-primary-foreground transition-all hover:scale-105 shadow-xl hover:shadow-primary/20 bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Play className="w-6 h-6 fill-current" />
                                    Mulai Menonton
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function DetailSkeleton() {
    return (
        <div className="min-h-screen pt-20">
            <div className="relative max-w-7xl mx-auto px-4 py-8">
                <Skeleton className="w-24 h-6 mb-6" />
                <div className="flex flex-col md:flex-row gap-8">
                    <Skeleton className="w-[180px] sm:w-[220px] md:w-[280px] aspect-[3/4] rounded-xl shrink-0 mx-auto md:mx-0" />
                    <div className="flex-1 space-y-4">
                        <Skeleton className="h-10 w-3/4 mx-auto md:mx-0" />
                        <Skeleton className="h-6 w-1/2 mx-auto md:mx-0" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-12 w-48 rounded-full mx-auto md:mx-0" />
                    </div>
                </div>
            </div>
        </div>
    );
}
