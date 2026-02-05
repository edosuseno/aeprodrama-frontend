"use client";

import { useFreeReelsForYou, useFreeReelsHome, useFreeReelsAnime, FreeReelsModule, FreeReelsItem } from "@/hooks/useFreeReels";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";

// Helper to extract items from a module
function getModuleItems(module: FreeReelsModule): FreeReelsItem[] {
  if (module.type === "recommend" && module.items && module.items.length > 0) {
    const firstItem = module.items[0];
    if (firstItem.module_card && firstItem.module_card.items) {
      return firstItem.module_card.items as FreeReelsItem[];
    }
  }
  return module.items || [];
}

function SectionLoader({ count = 6, titleWidth = "w-48" }: { count?: number, titleWidth?: string }) {
  return (
    <section className="space-y-4">
      <div className={`h-7 md:h-8 ${titleWidth} bg-white/10 rounded-lg animate-pulse`} />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-3 md:gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <UnifiedMediaCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

function cleanTitle(title: string): string {
  return title.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
}

function safeArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.items && Array.isArray(data.items)) return data.items;
  if (data.data?.items && Array.isArray(data.data.items)) return data.data.items;
  return [];
}

export function FreeReelsHome() {
  const { data: forYouData, isLoading: loadingForYou, error: errorForYou, refetch: refetchForYou } = useFreeReelsForYou();
  const { data: homeData, isLoading: loadingHome, error: errorHome, refetch: refetchHome } = useFreeReelsHome();
  const { data: animeData, isLoading: loadingAnime, error: errorAnime, refetch: refetchAnime } = useFreeReelsAnime();

  if (errorForYou && errorHome && errorAnime) {
    return (
      <UnifiedErrorDisplay
        onRetry={() => {
          if (errorForYou) refetchForYou();
          if (errorHome) refetchHome();
          if (errorAnime) refetchAnime();
        }}
      />
    );
  }

  const renderGrid = (items: any[]) => {
    const validItems = safeArray(items).filter((item: any) => item.title && item.cover);

    // SIASAT PRESISI: Hanya tampilkan kelipatan 9 agar baris selalu PENUH.
    // Jika film >= 18, kita ambil 18. Jika < 18 tapi >= 9, kita ambil 9.
    // Ini solusi agar tidak ada kartu 'jomblo' sendirian di baris baru paman.
    let countToDisplay = 9;
    if (validItems.length >= 18) {
      countToDisplay = 18;
    } else if (validItems.length < 9) {
      countToDisplay = validItems.length; // Jika di bawah 9, 1 baris saja
    }

    const displayItems = validItems.slice(0, countToDisplay);

    if (displayItems.length === 0) return null;

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-3 md:gap-5">
        {displayItems.map((item: any, idx: number) => (
          <UnifiedMediaCard
            key={`${item.key || idx}-${idx}`}
            title={item.title}
            cover={item.cover}
            link={`/detail/freereels/${item.key}`}
            episodes={item.episode_count || 0}
            topRightBadge={item.follow_count ? { text: `${(item.follow_count / 1000).toFixed(1)}k`, isTransparent: true } : null}
            index={idx}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-20">

      {/* SECTION: Rekomendasi */}
      {loadingForYou ? (
        <SectionLoader count={9} />
      ) : (
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold font-display text-foreground">
            Rekomendasi Untukmu
          </h2>
          {renderGrid(safeArray(forYouData).filter((item: any) => item.title && item.cover))}
        </section>
      )}

      {/* SECTION: Home Modules */}
      {loadingHome ? (
        <div className="space-y-12">
          <SectionLoader count={9} />
          <SectionLoader count={9} />
        </div>
      ) : (
        safeArray(homeData)
          ?.filter((module: any) => module.type !== 'coming_soon')
          .map((module: any, mIdx: number) => {
            const items = getModuleItems(module);
            const validItems = items.filter(item => item.title && item.cover);
            if (validItems.length === 0) return null;

            const title = module.module_name ? cleanTitle(module.module_name) : "";

            return (
              <section key={`home-module-${mIdx}`} className="space-y-4">
                {title && (
                  <h2 className="text-xl md:text-2xl font-bold font-display text-foreground">
                    {title}
                  </h2>
                )}
                {renderGrid(validItems)}
              </section>
            );
          })
      )}

      {/* SECTION: Anime Modules */}
      {!loadingAnime && safeArray(animeData).length > 0 && (
        <section className="space-y-12">
          {safeArray(animeData).map((module: any, mIdx: number) => {
            const items = getModuleItems(module);
            const validItems = items.filter(item => item.title && item.cover);
            if (validItems.length === 0) return null;

            return (
              <div key={`anime-module-${mIdx}`} className="space-y-4">
                {module.module_name && (
                  <h2 className="text-xl md:text-2xl font-bold font-display text-foreground">
                    {cleanTitle(module.module_name)}
                  </h2>
                )}
                {renderGrid(validItems)}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
