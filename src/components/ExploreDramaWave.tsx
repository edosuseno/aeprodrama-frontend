
"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteDramaWave } from "@/hooks/useDramaWave";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { Loader2 } from "lucide-react";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";

export function ExploreDramaWave() {
    const [selectedCategory, setSelectedCategory] = useState('home');
    
    const categories = [
        { id: 'home', name: '🏠 Home (Semua)' },
        { id: 'popular', name: '🔥 Populer' },
        { id: 'free', name: '🎁 Gratis' },
        { id: 'trending', name: '📈 Trending' }
    ];

    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    } = useInfiniteDramaWave(selectedCategory);

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

    if (isError) {
        console.error("ExploreDramaWave Error:", error);
        return <div className="text-red-500 p-4">Error loading data: {error?.message || 'Unknown error'}</div>;
    }

    return (
        <section>
            <div className="flex flex-col gap-6 mb-8">
                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground uppercase tracking-tight">
                    DramaWave Originals
                </h2>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                {infiniteData?.pages.map((page, pageIdx) =>
                    page.map((drama: any, idx: number) => (
                        <UnifiedMediaCard
                            key={`${drama.shortPlayId}-${pageIdx}-${idx}`}
                            title={drama.shortPlayName}
                            cover={drama.shortPlayCover || drama.cover}
                            link={`/detail/dramawave/${drama.shortPlayId}`}
                            episodes={drama.chapterCount || drama.episodeCount || 0}
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
                ) : !isLoading && infiniteData && (
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
