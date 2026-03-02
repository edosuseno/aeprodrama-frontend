"use client";

import { useShortMaxLatest, useShortMaxRekomendasi } from "@/hooks/useShortMax";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";

export function ShortMaxHome() {
    const { data: latestData, isLoading: loadingLatest, error: errorLatest, refetch: refetchLatest } = useShortMaxLatest();
    const { data: rekomendasiData, isLoading: loadingRekomendasi, error: errorRekomendasi, refetch: refetchRekomendasi } = useShortMaxRekomendasi();

    const isLoading = loadingLatest || loadingRekomendasi;

    if (isLoading) {
        return (
            <div className="space-y-10">
                {Array.from({ length: 2 }).map((_, sectionIndex) => (
                    <div key={sectionIndex}>
                        <div className="h-7 w-48 bg-muted/50 rounded animate-pulse mb-4" />
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                            {Array.from({ length: 9 }).map((_, cardIndex) => (
                                <UnifiedMediaCardSkeleton key={cardIndex} index={cardIndex} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (errorLatest || errorRekomendasi) {
        return (
            <UnifiedErrorDisplay
                title="Gagal Memuat ShortMax"
                message="Tidak dapat terhubung ke layanan ShortMax."
                onRetry={() => {
                    refetchLatest();
                    refetchRekomendasi();
                }}
            />
        );
    }

    const hasLatest = latestData && latestData.length > 0;
    const hasRekomendasi = rekomendasiData && rekomendasiData.length > 0;

    return (
        <div className="space-y-10">
            {/* Terbaru Section */}
            {hasLatest && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold font-display text-foreground">
                            Drama Terbaru
                        </h2>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                        {latestData.slice(0, 18).map((drama, index) => (
                            <UnifiedMediaCard
                                key={`${drama.shortPlayId}-${index}`}
                                index={index}
                                title={drama.title}
                                cover={drama.cover}
                                link={`/detail/shortmax/${drama.shortPlayId}`}
                                episodes={drama.totalEpisodes}
                                topLeftBadge={drama.label ? {
                                    text: drama.label,
                                    color: "#E52E2E"
                                } : null}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Rekomendasi Section */}
            {rekomendasiData && rekomendasiData.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold font-display text-foreground">
                            Rekomendasi Pilihan
                        </h2>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
                        {rekomendasiData.slice(0, 18).map((drama, index) => (
                            <UnifiedMediaCard
                                key={`${drama.shortPlayId}-${index}`}
                                index={index}
                                title={drama.title}
                                cover={drama.cover}
                                link={`/detail/shortmax/${drama.shortPlayId}`}
                                episodes={drama.totalEpisodes}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
