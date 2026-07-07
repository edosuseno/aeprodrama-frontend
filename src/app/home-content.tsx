"use client";

import { PlatformSelector } from "@/components/PlatformSelector";
import dynamic from 'next/dynamic';

const DramaSection = dynamic(() => import('@/components/DramaSection').then(m => m.DramaSection));
const ReelShortSection = dynamic(() => import('@/components/ReelShortSection').then(m => m.ReelShortSection));
const NetShortHome = dynamic(() => import('@/components/NetShortHome').then(m => m.NetShortHome));
const MeloloHome = dynamic(() => import('@/components/MeloloHome').then(m => m.MeloloHome));
const FlickReelsHome = dynamic(() => import('@/components/FlickReelsHome').then(m => m.FlickReelsHome));
const FreeReelsHome = dynamic(() => import('@/components/FreeReelsHome').then(m => m.FreeReelsHome));
const ExploreDramas = dynamic(() => import('@/components/ExploreDramas').then(m => m.ExploreDramas));
const ExploreReelShort = dynamic(() => import('@/components/ExploreReelShort').then(m => m.ExploreReelShort));
const ExploreNetShort = dynamic(() => import('@/components/ExploreNetShort').then(m => m.ExploreNetShort));
const ExploreMelolo = dynamic(() => import('@/components/ExploreMelolo').then(m => m.ExploreMelolo));
const ExploreFlickReels = dynamic(() => import('@/components/ExploreFlickReels').then(m => m.ExploreFlickReels));
const ExploreFreeReels = dynamic(() => import('@/components/ExploreFreeReels').then(m => m.ExploreFreeReels));
const ShortMaxHome = dynamic(() => import('@/components/ShortMaxHome').then(m => m.ShortMaxHome));
const ExploreShortMax = dynamic(() => import('@/components/ExploreShortMax').then(m => m.ExploreShortMax));
const MovieBoxHome = dynamic(() => import('@/components/MovieBoxHome').then(m => m.MovieBoxHome));
const ExploreStardustTV = dynamic(() => import('@/components/ExploreStardustTV').then(m => m.ExploreStardustTV));
const ExploreDramaWave = dynamic(() => import('@/components/ExploreDramaWave').then(m => m.ExploreDramaWave));
const ExploreDramanova = dynamic(() => import('@/components/ExploreDramanova').then(m => m.ExploreDramanova));
const ExploreVelolo = dynamic(() => import('@/components/ExploreVelolo').then(m => m.ExploreVelolo));
const ExploreIdrama2 = dynamic(() => import('@/components/ExploreIdrama2').then(m => m.ExploreIdrama2));
const ExploreVigloo = dynamic(() => import('@/components/ExploreVigloo').then(m => m.ExploreVigloo));
const ExploreRadreels = dynamic(() => import('@/components/ExploreRadreels').then(m => m.ExploreRadreels));
const ExploreFlexTV = dynamic(() => import('@/components/ExploreFlexTV').then(m => m.ExploreFlexTV));
const ExploreReelife = dynamic(() => import('@/components/ExploreReelife').then(m => m.ExploreReelife));
const ExplorePine = dynamic(() => import('@/components/ExplorePine').then(m => m.ExplorePine));
const ExploreShortwave2 = dynamic(() => import('@/components/ExploreShortwave2').then(m => m.ExploreShortwave2));
const ExploreShortSky = dynamic(() => import('@/components/ExploreShortSky').then(m => m.ExploreShortSky));
const ExploreCubetv = dynamic(() => import('@/components/ExploreCubetv').then(m => m.ExploreCubetv));
const DotDramaList = dynamic(() => import('@/components/DotDramaList').then(m => m.DotDramaList));
const GoodShortList = dynamic(() => import('@/components/GoodShortList').then(m => m.GoodShortList));
const MeloShortList = dynamic(() => import('@/components/MeloShortList').then(m => m.MeloShortList));
const HomeView = dynamic(() => import('@/components/HomeView').then(m => m.HomeView));
import { useForYouDramas, useLatestDramas, useTrendingDramas, useDubindoDramas } from "@/hooks/useDramas";
import { usePlatform } from "@/hooks/usePlatform";

export default function HomeContent() {
  const { isHome, isDramaBox, isReelShort, isNetShort, isShortMax, isMelolo, isFlickReels, isFreeReels, isMovieBox, isStardustTV, isIdrama2, isDramaWave, isDramaNova, isVelolo, isDotDrama, isGoodShort, isMeloShort, isVigloo, isRadreels, isFlexTV, isReelife, isPine, isShortwave2, isShortsky, isCubetv } = usePlatform();

  // Fetch data for all DramaBox sections (Only when in Home or DramaBox)
  const isDramaBoxActive = isHome || isDramaBox;
  const { data: popularDramas, isLoading: loadingPopular, error: errorPopular, refetch: refetchPopular } = useForYouDramas(isDramaBoxActive);
  const { data: latestDramas, isLoading: loadingLatest, error: errorLatest, refetch: refetchLatest } = useLatestDramas(isDramaBoxActive);
  const { data: trendingDramas, isLoading: loadingTrending, error: errorTrending, refetch: refetchTrending } = useTrendingDramas(isDramaBoxActive);
  const { data: dubindoDramas, isLoading: loadingDubindo, error: errorDubindo, refetch: refetchDubindo } = useDubindoDramas(isDramaBoxActive);

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

      {/* iDrama Content */}
      {isIdrama2 && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreIdrama2 />
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

      {/* Dot Drama Content */}
      {isDotDrama && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <DotDramaList />
        </div>
      )}

      {/* GoodShort Content */}
      {isGoodShort && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <GoodShortList />
        </div>
      )}

      {/* MeloShort Content */}
      {isMeloShort && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <MeloShortList />
        </div>
      )}

      {/* Vigloo Content */}
      {isVigloo && (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreVigloo />
        </div>
      )}

      {/* Radreels Content */}
      {isRadreels && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreRadreels />
        </div>
      )}

      {/* FlexTV Content */}
      {isFlexTV && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreFlexTV />
        </div>
      )}

      {/* Reelife Content */}
      {isReelife && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreReelife />
        </div>
      )}

      {/* Pine Content */}
      {isPine && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExplorePine />
        </div>
      )}

      {/* Shortwave2 Content */}
      {isShortwave2 && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreShortwave2 />
        </div>
      )}

      {/* ShortSky Content */}
      {isShortsky && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreShortSky />
        </div>
      )}

      {/* CubeTV Content */}
      {isCubetv && (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-10">
          <ExploreCubetv />
        </div>
      )}
    </main>
  );
}
