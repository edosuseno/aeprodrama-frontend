"use client";

import { PlatformSelector } from "@/components/PlatformSelector";
import { DramaSection } from "@/components/DramaSection";
import { ReelShortSection } from "@/components/ReelShortSection";
import { NetShortHome } from "@/components/NetShortHome";
import { MeloloHome } from "@/components/MeloloHome";
import { FlickReelsHome } from "@/components/FlickReelsHome";
import { FreeReelsHome } from "@/components/FreeReelsHome";
import { ExploreDramas } from "@/components/ExploreDramas";
import { ExploreReelShort } from "@/components/ExploreReelShort";
import { ExploreNetShort } from "@/components/ExploreNetShort";
import { ExploreMelolo } from "@/components/ExploreMelolo";
import { ExploreFlickReels } from "@/components/ExploreFlickReels";
import { ExploreFreeReels } from "@/components/ExploreFreeReels";
import { ShortMaxHome } from "@/components/ShortMaxHome";
import { ExploreShortMax } from "@/components/ExploreShortMax";
import { MovieBoxHome } from "@/components/MovieBoxHome";
import { useForYouDramas, useLatestDramas, useTrendingDramas, useDubindoDramas } from "@/hooks/useDramas";
import { usePlatform } from "@/hooks/usePlatform";

export default function HomeContent() {
  const { isDramaBox, isReelShort, isNetShort, isShortMax, isMelolo, isFlickReels, isFreeReels, isMovieBox } = usePlatform();

  // Fetch data for all DramaBox sections
  const { data: popularDramas, isLoading: loadingPopular, error: errorPopular, refetch: refetchPopular } = useForYouDramas();
  const { data: latestDramas, isLoading: loadingLatest, error: errorLatest, refetch: refetchLatest } = useLatestDramas();
  const { data: trendingDramas, isLoading: loadingTrending, error: errorTrending, refetch: refetchTrending } = useTrendingDramas();
  const { data: dubindoDramas, isLoading: loadingDubindo, error: errorDubindo, refetch: refetchDubindo } = useDubindoDramas();

  return (
    <main className="min-h-screen pt-16">
      {/* Platform Selector */}
      <div className="glass-strong sticky top-16 z-40">
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10">
          <PlatformSelector />
        </div>
      </div>

      {/* DramaBox Content - Multiple Sections */}
      {isDramaBox && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <DramaSection
            title="Terbaru"
            dramas={latestDramas}
            isLoading={loadingLatest}
            error={!!errorLatest}
            onRetry={() => refetchLatest()}
          />
          <DramaSection
            title="Terpopuler"
            dramas={trendingDramas}
            isLoading={loadingTrending}
            error={!!errorTrending}
            onRetry={() => refetchTrending()}
          />
          <DramaSection
            title="Dubindo"
            dramas={dubindoDramas}
            isLoading={loadingDubindo}
            error={!!errorDubindo}
            onRetry={() => refetchDubindo()}
          />
          <ExploreDramas />
        </div>
      )}

      {/* ReelShort Content - Multiple Sections */}
      {isReelShort && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ReelShortSection />
          <ExploreReelShort />
        </div>
      )}

      {/* NetShort Content */}
      {isNetShort && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <NetShortHome />
          <ExploreNetShort />
        </div>
      )}

      {/* ShortMax Content */}
      {isShortMax && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ShortMaxHome />
          <ExploreShortMax />
        </div>
      )}

      {/* Melolo Content */}
      {isMelolo && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <MeloloHome />
          <ExploreMelolo />
        </div>
      )}

      {/* FlickReels Content */}
      {isFlickReels && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <FlickReelsHome />
          <ExploreFlickReels />
        </div>
      )}

      {/* FreeReels Content */}
      {isFreeReels && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <FreeReelsHome />
          <ExploreFreeReels />
        </div>
      )}

      {/* MovieBox Content */}
      {isMovieBox && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <MovieBoxHome />
          {/* MovieBox infinite scroll coming soon or integrated in Home */}
        </div>
      )}
    </main>
  );
}


