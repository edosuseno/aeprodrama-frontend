"use client";

import { useEffect, useRef } from "react";
import { useInfiniteDrmanova, useDrmanovaExplore } from "@/hooks/useDrmanova";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { Loader2 } from "lucide-react";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";

export function ExploreDramanova() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteDrmanova('all');

    const { data: hot18, isLoading: loading18 } = useDrmanovaExplore(1, 'drama18');

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
                rootMargin: "200px", 
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
        <section className="overflow-hidden">
            {/* 1. HOT 18+ SECTION (TOP PRIORITY) */}
            <div className="mb-14">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 bg-primary rounded-full shadow-glow-sm" />
                    <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground uppercase tracking-tight">
                        DRAMANOVA COLLECTION
                    </h2>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                    {loading18 ? (
                        Array.from({ length: 9 }).map((_, i) => (
                            <UnifiedMediaCardSkeleton key={`hot-skel-${i}`} index={i} />
                        ))
                    ) : (
                        hot18?.map((drama: any, idx: number) => (
                            <UnifiedMediaCard
                                key={`hot-${drama.id}-${idx}`}
                                title={drama.title}
                                cover={drama.cover}
                                link={`/detail/dramanova/${drama.id}`}
                                episodes={drama.chapterCount}
                                index={idx}
                                badge="18+"
                            />
                        ))
                    )}
                </div>
            </div>

            {/* 2. REGULAR COLLECTION */}
            <div className="flex items-center gap-3 mb-6 opacity-60">
                <div className="w-1.5 h-6 bg-muted-foreground rounded-full" />
                <h2 className="font-display font-bold text-lg md:text-xl text-foreground uppercase tracking-tight">
                    Koleksi Lainnya
                </h2>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                {data?.pages.map((page, pageIdx) =>
                    page.map((drama: any, idx: number) => (
                        <UnifiedMediaCard
                            key={`${drama.id}-${pageIdx}-${idx}`}
                            title={drama.title}
                            cover={drama.cover}
                            link={`/detail/dramanova/${drama.id}`}
                            episodes={drama.chapterCount}
                            index={idx}
                            badge="DramaNova"
                        />
                    ))
                )}

                {/* Skeletons while loading initial data */}
                {isLoading &&
                    Array.from({ length: 18 }).map((_, i) => (
                        <UnifiedMediaCardSkeleton key={i} index={i} />
                    ))}
            </div>
            
            {/* Trigger Area */}
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
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            Scroll untuk melihat koleksi lainnya
                        </span>
                    </div>
                ) : !isLoading && data && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-px bg-white/10" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">
                            Akhir dari Katalog DramaNova
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
