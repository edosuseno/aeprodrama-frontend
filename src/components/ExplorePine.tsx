"use client";

import { useEffect, useRef } from "react";
import { useInfinitePine } from "@/hooks/usePine";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { Loader2 } from "lucide-react";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";

export function ExplorePine() {
    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loadingInfinite,
        isError: errorInfinite,
    } = useInfinitePine();

    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !isFetchingNextPage) {
                    if (hasNextPage) {
                        fetchNextPage();
                    }
                }
            },
            {
                rootMargin: "300px",
                threshold: 0.05
            }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (errorInfinite && !infiniteData?.pages?.length) return null;

    return (
        <section>
            <div className="flex flex-col gap-6 mb-8">
                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground uppercase tracking-tight">
                    Eksplorasi Pine
                </h2>
            </div>

            {loadingInfinite ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                    {[...Array(12)].map((_, i) => (
                        <UnifiedMediaCardSkeleton key={i} />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                        {infiniteData?.pages.map((page, pageIndex) => (
                            page.map((drama: any) => (
                                <UnifiedMediaCard
                                    key={`${pageIndex}-${drama.id}`}
                                    title={drama.title || ""}
                                    cover={drama.cover || drama.image || ""}
                                    link={`/detail/pine/${drama.id}?cover=${encodeURIComponent(drama.cover || drama.image || '')}&cat=${encodeURIComponent(drama.categories || '')}&vc=${drama.viewCount || 0}`}
                                    episodes={drama.totalEpisodes}
                                    badge="VIP"
                                />
                            ))
                        ))}
                    </div>

                    <div
                        ref={loadMoreRef}
                        className="w-full py-10 flex justify-center items-center"
                    >
                        {isFetchingNextPage ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : hasNextPage ? (
                            <div className="h-8" />
                        ) : (
                            <p className="text-muted-foreground text-sm font-medium">
                                Tidak ada drama lagi
                            </p>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
