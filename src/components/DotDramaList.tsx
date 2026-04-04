"use client";

import { useEffect, useRef } from "react";
import { useInfiniteDotDrama } from "@/hooks/useDotDrama";
import { useQueryClient } from "@tanstack/react-query";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { fetchJson } from "@/lib/fetcher";
import { Loader2 } from "lucide-react";

export function DotDramaList() {
    const { 
        data, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage, 
        isLoading, 
        isError, 
        refetch 
    } = useInfiniteDotDrama();
    
    const queryClient = useQueryClient();
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !isFetchingNextPage && hasNextPage) {
                    fetchNextPage();
                }
            },
            { rootMargin: "200px", threshold: 0.1 }
        );

        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) {
        return (
            <section className="space-y-4">
                <div className="h-7 w-48 bg-muted/50 rounded animate-pulse mb-4" />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                    {Array.from({ length: 18 }).map((_, i) => (
                        <UnifiedMediaCardSkeleton key={i} index={i} />
                    ))}
                </div>
            </section>
        );
    }

    if (isError) {
        return (
            <UnifiedErrorDisplay
                title="Gagal Memuat Dot Drama"
                message="Pastikan backend berjalan dan koneksi internet stabil."
                onRetry={() => refetch()}
            />
        );
    }

    const allDramas = data?.pages.flat() || [];

    if (allDramas.length === 0 && !isLoading) {
        return (
            <section className="text-center py-10">
                <p className="text-muted-foreground">Tidak ada drama ditemukan di Dot Drama.</p>
            </section>
        )
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                    <h2 className="text-xl font-bold font-display text-foreground uppercase tracking-tight">
                        Dot Drama Collection
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                {allDramas.map((drama, index) => (
                    <UnifiedMediaCard
                        key={`${drama.id}-${index}`}
                        index={index}
                        title={drama.title}
                        cover={drama.cover}
                        link={`/detail/dotdrama/${drama.id}`}
                        episodes={drama.chapterCount}
                        onPrefetch={() => {
                            queryClient.prefetchQuery({
                                queryKey: ["dotdrama", "detail", String(drama.id)],
                                queryFn: async () => {
                                    const res = await fetchJson<any>(`/api/dotdrama/detail?id=${drama.id}`);
                                    return res.data || res || null;
                                },
                                staleTime: 1000 * 60 * 10,
                            });
                        }}
                        topLeftBadge={{
                            text: "DOT",
                            color: "#06B6D4"
                        }}
                    />
                ))}
            </div>

            {/* Trigger Area */}
            <div ref={loadMoreRef} className="mt-4 py-8 flex flex-col justify-center items-center w-full min-h-[100px]">
                {isFetchingNextPage ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Memuat Koleksi...</span>
                    </div>
                ) : hasNextPage ? (
                    <div className="opacity-20 flex flex-col items-center gap-2">
                        <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" />
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Scroll untuk koleksi lainnya</span>
                    </div>
                ) : allDramas.length > 0 && (
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">Akhir dari Katalog Dot Drama</p>
                )}
            </div>
        </section>
    );
}
