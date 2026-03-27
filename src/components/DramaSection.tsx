"use client";

import { useQueryClient } from "@tanstack/react-query";
import { fetchDramaDetail } from "@/hooks/useDramaDetail";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton"; // Import skeleton
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import type { Drama } from "@/types/drama";

interface DramaSectionProps {
  title: string;
  dramas?: any[];
  isLoading?: boolean;
  platform: string; // New required prop
  error?: boolean;
  onRetry?: () => void;
}

export function DramaSection({ title, dramas, isLoading, platform, error, onRetry }: DramaSectionProps) {
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <UnifiedMediaCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  // Normalize different API formats (DramaBox, ReelShort, FlickReels, etc.)
  const validDramas = (dramas || []).map(d => {
    // Explicitly find the ID
    const actualId = d.bookId || d.book_id || d.shortPlayId || d.id || d.key || d.playlet_id;
    const actualTitle = d.bookName || d.book_title || d.title || d.book_name || d.shortPlayName;
    const actualCover = d.coverWap || d.cover || d.book_pic || d.thumb_url || d.shortPlayCover || d.poster || d.image;
    const actualEpisodes = d.chapterCount || d.total_chapter || d.totalEpisodes || d.chapter_count || d.upload_num;
    
    return {
      id: actualId,
      title: actualTitle,
      cover: actualCover,
      episodes: actualEpisodes,
      corner: d.corner || (d.book_mark ? { name: d.book_mark.text, color: d.book_mark.color } : d.cornerVo ? { name: d.cornerVo.name, color: d.cornerVo.color } : null),
    };
  }).filter(d => d.id && d.cover);

  const displayCount = Math.min(validDramas.length, 6);
  const queryClient = useQueryClient();

  return (
    <section>
      <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
        {title}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {validDramas.slice(0, displayCount).map((drama, index) => {
          const isPopular = drama.corner?.name?.toLowerCase().includes("populer");
          const badgeColor = isPopular ? "#E52E2E" : (drama.corner?.color || "#e5a00d");

          return (
            <UnifiedMediaCard
              key={`${platform}-${drama.id}-${index}`}
              index={index}
              title={drama.title}
              cover={drama.cover}
              link={`/detail/${platform}/${drama.id}`}
              episodes={drama.episodes}
              onPrefetch={() => {
                if (platform === "dramabox") {
                  queryClient.prefetchQuery({
                    queryKey: ["drama", "detail", drama.id],
                    queryFn: () => fetchDramaDetail(drama.id),
                    staleTime: 1000 * 60 * 10,
                  });
                }
              }}
              topLeftBadge={drama.corner ? {
                text: drama.corner.name,
                color: badgeColor
              } : null}
            />
          );
        })}
      </div>
    </section>
  );
}

