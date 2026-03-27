"use client";

import { useDramabox2Explore, useDramabox2Detail } from "@/hooks/useDramabox2";
import { useQueryClient } from "@tanstack/react-query";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { fetchJson } from "@/lib/fetcher";

export function Dramabox2List() {
    const { data: items, isLoading, isError, refetch } = useDramabox2Explore(1);
    const queryClient = useQueryClient();

    if (isLoading) {
        return (
            <section className="space-y-4">
                <div className="h-7 w-48 bg-muted/50 rounded animate-pulse mb-4" />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <UnifiedMediaCardSkeleton key={i} index={i} />
                    ))}
                </div>
            </section>
        );
    }

    if (isError || !items) {
        return (
            <UnifiedErrorDisplay
                title="Gagal Memuat Dramabox v2"
                message="Pastikan backend berjalan dan token vidrama.asia masih aktif."
                onRetry={() => refetch()}
            />
        );
    }

    if (items.length === 0) {
        return (
            <section className="text-center py-10">
                <p className="text-muted-foreground">Tidak ada drama ditemukan di Dramabox v2.</p>
            </section>
        )
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="text-xl font-bold font-display text-foreground">
                        DramaBox v2 (Vidrama)
                    </h2>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                    Private Source
                </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                {items.map((drama, index) => (
                    <UnifiedMediaCard
                        key={drama.id}
                        index={index}
                        title={drama.title}
                        cover={drama.cover}
                        link={`/detail/dramabox2/${drama.id}`}
                        episodes={drama.chapterCount}
                        onPrefetch={() => {
                            queryClient.prefetchQuery({
                                queryKey: ["dramabox2", "detail", String(drama.id)],
                                queryFn: async () => {
                                    const res = await fetchJson<any>(`/api/dramabox2/detail?id=${drama.id}`);
                                    return res.data;
                                },
                                staleTime: 1000 * 60 * 10,
                            });
                        }}
                        topLeftBadge={{
                            text: "v2",
                            color: "#E52E2E"
                        }}
                    />
                ))}
            </div>
        </section>
    );
}
