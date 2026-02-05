"use client";

import { useEffect, useRef } from "react";
import { useMovieBoxExplore } from "@/hooks/useMovieBox";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { Loader2, Film } from "lucide-react";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";

export function ExploreMovieBox() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useMovieBoxExplore();

    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !isFetchingNextPage && hasNextPage) {
                    fetchNextPage();
                }
            },
            {
                rootMargin: "300px",
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
            <div className="flex items-center gap-2 mb-6">
                <Film className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Jelajahi Film Lainnya</h2>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-3 md:gap-5">
                {data?.pages.map((page, pageIdx) =>
                    page.data.map((movie: any, idx: number) => (
                        <UnifiedMediaCard
                            key={`${movie.id}-${pageIdx}-${idx}`}
                            title={movie.title}
                            cover={movie.poster}
                            link={`/detail/moviebox/${movie.id}`}
                            index={idx}
                            badge={movie.year ? String(movie.year) : null}
                            topRightBadge={movie.rating ? { text: `⭐ ${movie.rating}`, isTransparent: true } : null}
                        />
                    ))
                )}

                {/* Skeletons while loading initial data */}
                {isLoading &&
                    Array.from({ length: 9 }).map((_, i) => (
                        <UnifiedMediaCardSkeleton key={i} />
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
                            Memuat film lainnya...
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
                        <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-50">
                            Akhir dari Katalog MovieBox
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
