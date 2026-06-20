"use client";

import { useEffect, useRef } from "react";
import { useInfiniteIdrama2 } from "@/hooks/useIdrama2";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { Loader2 } from "lucide-react";

export function ExploreIdrama2() {
    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loadingInfinite,
        isError: errorInfinite,
    } = useInfiniteIdrama2();

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

    const isLoading = loadingInfinite;
    const isError = errorInfinite;

    if (isError) return null;

    return (
        <section>
            <div className="flex flex-col gap-6 mb-8">
                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
                    iDrama Originals
                </h2>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                {infiniteData?.pages.map((page, pageIdx) =>
                    page.map((drama: any, idx: number) => (
                        <UnifiedMediaCard
                            key={`${drama.id}-${pageIdx}-${idx}`}
                            title={drama.title || drama.book_title}
                            cover={drama.cover || drama.book_pic}
                            link={`/detail/idrama2/${drama.id}`}
                            episodes={drama.totalEpisodes || drama.episodes?.length || 0}
                            index={idx}
                        />
                    ))
                )}

                {/* Skeletons while loading */}
                {isLoading &&
                    Array.from({ length: 9 }).map((_, i) => (
                        <UnifiedMediaCardSkeleton key={i} />
                    ))}
            </div>
            
            {!isLoading && infiniteData && infiniteData.pages[0].length === 0 && (
                <div className="py-12 flex flex-col justify-center items-center w-full">
                    <p className="text-muted-foreground">Belum ada drama yang tersedia.</p>
                </div>
            )}
            
            {/* Trigger Area - Only for Infinite Scroll */}
            <div
                ref={loadMoreRef}
                className="mt-4 py-12 flex flex-col justify-center items-center w-full min-h-[150px]"
            >
                {isFetchingNextPage ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="text-sm font-medium text-muted-foreground animate-pulse">
                            Memuat drama lainnya...
                        </span>
                    </div>
                ) : hasNextPage ? (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                    </div>
                ) : !loadingInfinite && infiniteData && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-px bg-white/10" />
                        <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-50">
                            Akhir dari Katalog
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
