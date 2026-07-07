"use client";

import { useEffect, useRef } from "react";
import { useInfiniteCubetv } from "@/hooks/useCubetv";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { Loader2 } from "lucide-react";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";

export function ExploreCubetv() {
    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loadingInfinite,
        isError: errorInfinite,
    } = useInfiniteCubetv();

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

    if (isError && !infiniteData?.pages?.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-destructive/10 p-4 rounded-full mb-4">
                    <Loader2 className="w-10 h-10 text-destructive animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Gagal Memuat Data</h3>
                <p className="text-muted-foreground max-w-md">
                    Silakan periksa koneksi internet atau coba lagi nanti.
                </p>
            </div>
        );
    }

    return (
        <section>
            <div className="flex flex-col gap-6 mb-8">
                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground uppercase tracking-tight text-cyan-400">
                    CubeTV Explore
                </h2>
            </div>
    
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                {infiniteData?.pages.map((page, pageIdx) =>
                    page.items.map((drama: any, idx: number) => (
                        <UnifiedMediaCard
                            key={`${drama.id}-${pageIdx}-${idx}`}
                            title={drama.title}
                            cover={drama.cover}
                            link={`/detail/cubetv/${drama.id}?title=${encodeURIComponent(drama.title)}&cover=${encodeURIComponent(drama.cover)}`}
                            episodes={drama.totalEpisodes || 0}
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
