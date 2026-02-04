"use client";

import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton"; // Import skeleton
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import type { Drama } from "@/types/drama";

interface DramaSectionProps {
  title: string;
  dramas?: Drama[];
  isLoading?: boolean;
  error?: boolean;    // New prop
  onRetry?: () => void; // New prop
}

export function DramaSection({ title, dramas, isLoading, error, onRetry }: DramaSectionProps) {
  if (error) {
    return (
      <section>
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
          {title}
        </h2>
        <UnifiedErrorDisplay
          title={`Gagal Memuat ${title}`}
          message="Tidak dapat mengambil data drama."
          onRetry={onRetry}
        />
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        {/* Title Skeleton */}
        <div className="h-7 md:h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-4" />

        {/* Grid Skeleton */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
          {Array.from({ length: 18 }).map((_, i) => (
            <UnifiedMediaCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  // Calculate items to show: Ensure it's a multiple of 6 for neat grid
  // Desktop has 6 cols. 
  // 1. Filter out dramas with bad/missing covers first
  const validDramas = dramas?.filter(d =>
    (d.cover || d.coverWap) && (!d.bookName || !d.bookName.includes("No Name"))
  ) || [];

  const totalAvailable = validDramas.length;
  // If we have plenty data, crop to nearest multiple of 9 (max 27)
  // If data is scarce (< 9), show all available
  let displayCount = totalAvailable;

  if (totalAvailable >= 9) {
    displayCount = Math.floor(Math.min(totalAvailable, 27) / 9) * 9;
  }

  return (
    <section>
      <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
        {title}
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2 md:gap-3">
        {validDramas.slice(0, displayCount).map((drama, index) => {
          // Normalize badge color: If text is "Terpopuler", force RED to match ReelShort/NetShort
          const isPopular = drama.corner?.name?.toLowerCase().includes("populer");
          const badgeColor = isPopular ? "#E52E2E" : (drama.corner?.color || "#e5a00d");

          return (
            <UnifiedMediaCard
              key={drama.bookId || `drama-${index}`}
              index={index}
              title={drama.bookName}
              cover={drama.coverWap || drama.cover || ""}
              link={`/detail/dramabox/${drama.bookId}`}
              episodes={drama.chapterCount}
              topLeftBadge={drama.corner ? {
                text: drama.corner.name,
                color: badgeColor
              } : null}
              topRightBadge={drama.rankVo ? {
                text: drama.rankVo.hotCode,
                isTransparent: true
              } : null}
            />
          );
        })}
      </div>
    </section>
  );
}

