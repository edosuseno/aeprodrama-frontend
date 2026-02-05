"use client";

import { useEffect, useRef } from "react";
import { useInfiniteDramas } from "@/hooks/useDramas";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { Loader2 } from "lucide-react";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";

export function ExploreDramas() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteDramas();

    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log("👀 [Explore] hasNextPage:", hasNextPage, "isFetching:", isFetchingNextPage);
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !isFetchingNextPage) {
                    if (hasNextPage) {
                        console.log("🚀 [Explore] Loading next page...");
                        fetchNextPage();
                    }
                }
            },
            {
                rootMargin: "200px", // Trigger lebih awal sebelum benar-benar sampai bawah
                threshold: 0.1
            }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isError) return null;

    return (
        <section className="mt-10">
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-6">
                Drama Lainnya
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                {data?.pages.map((page, pageIdx) =>
                    page.map((drama: any, idx: number) => (
                        <UnifiedMediaCard
                            key={`${drama.bookId}-${pageIdx}-${idx}`}
                            title={drama.bookName || drama.title}
                            cover={drama.coverWap || drama.cover}
                            link={`/detail/dramabox/${drama.bookId}`}
                            episodes={drama.chapterCount || drama.totalEpisodes}
                            index={idx}
                        />
                    ))
                )}

                {/* Skeletons while loading initial data */}
                {isLoading &&
                    Array.from({ length: 9 }).map((_, i) => (
                        <UnifiedMediaCardSkeleton key={i} />
                    ))}
            </div>

            {/* Trigger Area - Critical for Infinite Scroll */}
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
                    /* Invisible but takes space to trigger observer */
                    <div className="flex flex-col items-center gap-2 opacity-20">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            Scroll untuk melihat koleksi lainnya
                        </span>
                    </div>
                ) : !isLoading && data && (
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
