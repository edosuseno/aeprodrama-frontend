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
import { ExploreStardustTV } from "@/components/ExploreStardustTV";
import { ExploreDramaWave } from "@/components/ExploreDramaWave";
import { ExploreDramanova } from "@/components/ExploreDramanova";
import { ExploreVelolo } from "@/components/ExploreVelolo";
import { HeroCarousel } from "@/components/HeroCarousel";
import { HomeView } from "@/components/HomeView";
import { useForYouDramas, useLatestDramas, useTrendingDramas, useDubindoDramas } from "@/hooks/useDramas";
import { usePlatform } from "@/hooks/usePlatform";

export default function HomeContent() {
  const { isHome, isDramaBox, isReelShort, isNetShort, isShortMax, isMelolo, isFlickReels, isFreeReels, isMovieBox, isStardustTV, isDramaWave, isDramaNova, isVelolo } = usePlatform();

  // Fetch data for all DramaBox sections
  const { data: popularDramas, isLoading: loadingPopular, error: errorPopular, refetch: refetchPopular } = useForYouDramas();
  const { data: latestDramas, isLoading: loadingLatest, error: errorLatest, refetch: refetchLatest } = useLatestDramas();
  const { data: trendingDramas, isLoading: loadingTrending, error: errorTrending, refetch: refetchTrending } = useTrendingDramas();
  const { data: dubindoDramas, isLoading: loadingDubindo, error: errorDubindo, refetch: refetchDubindo } = useDubindoDramas();

  return (
    <main className="min-h-screen pt-20 pb-20">
      {/* 1. New Dedicated Home Page */}
      {isHome && <HomeView />}

      {/* 2. Platform Specific Pages */}
      {isDramaBox && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-12">
          <DramaSection
            title="Terbaru"
            dramas={latestDramas}
            isLoading={loadingLatest}
            platform="dramabox"
            error={!!errorLatest}
            onRetry={() => refetchLatest()}
          />
          <DramaSection
            title="Terpopuler"
            dramas={trendingDramas}
            isLoading={loadingTrending}
            platform="dramabox"
            error={!!errorTrending}
            onRetry={() => refetchTrending()}
          />
          <DramaSection
            title="Dubindo"
            dramas={dubindoDramas}
            isLoading={loadingDubindo}
            platform="dramabox"
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

      {/* StardustTV Content */}
      {isStardustTV && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreStardustTV />
        </div>
      )}

      {/* DramaWave Content */}
      {isDramaWave && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreDramaWave />
        </div>
      )}

      {/* DramaNova Content */}
      {isDramaNova && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreDramanova />
        </div>
      )}

      {/* Velolo Content */}
      {isVelolo && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreVelolo />
        </div>
      )}
    </main>
  );
}


