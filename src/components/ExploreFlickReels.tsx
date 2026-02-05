"use client";

import { useEffect, useRef } from "react";
import { useInfiniteFlickReels } from "@/hooks/useFlickReels";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { Loader2 } from "lucide-react";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";

export function ExploreFlickReels() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteFlickReels();

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
        <section className="mt-10">
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-6">
                Drama Lainnya
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                {data?.pages.map((page, pageIdx) =>
                    page.filter((d: any) => (d.playlet_id || d.id) && (d.title || d.name)).map((drama: any, idx: number) => (
                        <UnifiedMediaCard
                            key={`${drama.playlet_id || drama.book_id || drama.id}-${pageIdx}-${idx}`}
                            title={drama.title || drama.name}
                            cover={drama.cover || drama.cover_url}
                            link={`/detail/flickreels/${drama.playlet_id || drama.id}`}
                            episodes={drama.upload_num ? parseInt(drama.upload_num) : (drama.chapters_count || 0)}
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
                    <div className="flex flex-col items-center gap-2 opacity-20">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
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
