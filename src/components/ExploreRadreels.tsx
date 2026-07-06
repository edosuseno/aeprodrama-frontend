"use client";

import { useEffect, useRef } from "react";
import { useInfiniteRadreels } from "@/hooks/useRadreels";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { Loader2, AlertCircle, List } from "lucide-react";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";

export function ExploreRadreels() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteRadreels();

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

    // Menghapus return null diam-diam agar jika error, muncul peringatan di layar
    // if (isError && !data?.pages?.length) return null;

    return (
        <section className="">
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-6 uppercase tracking-tight">
                Radreels Collection
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                {data?.pages.map((page, pageIdx) =>
                    page.map((drama: any, idx: number) => (
                        <UnifiedMediaCard
                            key={`${drama.id}-${pageIdx}-${idx}`}
                            title={drama.title}
                            cover={drama.cover}
                            link={`/detail/radreels/${drama.id}`}
                            episodes={drama.totalEpisodes}
                            index={idx}
                            badge="Radreels"
                        />
                    ))
                )}

                {/* Skeletons while loading initial data */}
                {isLoading &&
                    Array.from({ length: 18 }).map((_, i) => (
                        <UnifiedMediaCardSkeleton key={i} index={i} />
                    ))}
                    
                {/* Visual Error State */}
                {isError && !data?.pages?.length && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4 opacity-80" />
                        <h3 className="text-lg font-semibold text-white mb-2">Gagal Memuat Data</h3>
                        <p className="text-sm text-gray-400 max-w-md mx-auto">
                            Terjadi kesalahan saat menghubungi server atau koneksi diblokir oleh sistem keamanan.
                        </p>
                    </div>
                )}
                
                {/* Empty State */}
                {!isLoading && !isError && data?.pages?.[0]?.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                            <List className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Katalog Kosong</h3>
                        <p className="text-sm text-gray-400 max-w-md mx-auto">
                            Katalog Radreels sedang tidak tersedia.
                        </p>
                    </div>
                )}
            </div>
            
            {/* Trigger Area */}
            <div
                ref={loadMoreRef}
                className="mt-4 py-12 flex flex-col justify-center items-center w-full min-h-[150px]"
            >
                {isFetchingNextPage ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="text-sm font-medium text-muted-foreground animate-pulse">
                            Memuat koleksi Radreels...
                        </span>
                    </div>
                ) : hasNextPage ? (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            Scroll untuk melihat koleksi lainnya
                        </span>
                    </div>
                ) : !isLoading && data && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-px bg-white/10" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">
                            Akhir dari Katalog Radreels
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
