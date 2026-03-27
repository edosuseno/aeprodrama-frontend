
"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteStardustTV, useStardustTVCategories } from "@/hooks/useStardustTV";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { Loader2 } from "lucide-react";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";

export function ExploreStardustTV() {
    const [selectedCategory, setSelectedCategory] = useState<string | number | undefined>(undefined);
    const { data: categories } = useStardustTVCategories();
    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loadingInfinite,
        isError: errorInfinite,
    } = useInfiniteStardustTV(selectedCategory, categories);

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
                    StardustTV Originals
                </h2>

                {/* Categories Filter */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory(undefined)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            selectedCategory === undefined
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                    >
                        🏠 Semua
                    </button>
                    {categories?.filter(cat => cat.category_id !== 0 && cat.display_name !== "SEMUA").map((cat) => (
                        <button
                            key={cat.category_id}
                            onClick={() => setSelectedCategory(cat.category_id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                selectedCategory === cat.category_id
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                }`}
                            >
                                {cat.display_name}
                            </button>
                        ))}
                    </div>
                </div>
    
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                    {infiniteData?.pages.map((page, pageIdx) =>
                        page.items.map((drama: any, idx: number) => (
                            <UnifiedMediaCard
                                key={`${drama.id || drama.shortPlayId}-${pageIdx}-${idx}`}
                                title={drama.title || drama.name}
                                cover={drama.poster || drama.image}
                                link={`/detail/stardusttv/${drama.id || drama.shortPlayId}`}
                                episodes={drama.totalEpisodes || drama.chapterCount || 0}
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
