"use client";
import { useMemo } from "react";

import { useForYouDramas, useLatestDramas } from "@/hooks/useDramas";
import { HeroCarousel } from "./HeroCarousel";
import { DramaSection } from "./DramaSection";
import { useReelShortHomepage, useInfiniteReelShort } from "@/hooks/useReelShort";
import { useFlickReelsForYou } from "@/hooks/useFlickReels";
import { useShortMaxLatest } from "@/hooks/useShortMax";
import { useMeloloTrending } from "@/hooks/useMelolo";
import { useDrmanovaExplore } from "@/hooks/useDrmanova";
import { useInfiniteVelolo } from "@/hooks/useVelolo";
import { useStardustTVExplore } from "@/hooks/useStardustTV";
import { useDramaWaveExplore } from "@/hooks/useDramaWave";
import { LucideIcon, Zap, Monitor, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnlineTracker } from "@/hooks/useStats";

export function HomeView() {
  const { data: popularDramas, isLoading: loadingPopular } = useForYouDramas();
  const { data: latestDramas, isLoading: loadingLatest } = useLatestDramas();
  
  // Fetch Other Platforms
  const { data: reelShortHome, isLoading: loadingReelShort } = useReelShortHomepage();
  const { data: flickReelsHome, isLoading: loadingFlickReels } = useFlickReelsForYou();
  const { data: shortMaxHome, isLoading: loadingShortMax } = useShortMaxLatest();
  const { data: meloloHome, isLoading: loadingMelolo } = useMeloloTrending();
  const { data: dramanovaHome, isLoading: loadingDramanova } = useDrmanovaExplore(1, 'all');
  const { data: veloloHome, isLoading: loadingVelolo } = useInfiniteVelolo();
  const { data: stardustHome, isLoading: loadingStardust } = useStardustTVExplore(1);
  const { data: dramawaveHome, isLoading: loadingDramawave } = useDramaWaveExplore(1, 'popular');
  
  // Real-time Data from Backend (Real Count + Base 1000)
  const { data: onlineCountReal } = useOnlineTracker();
  
  // Base number for UI (Start from 1000 + actual visitors)
  const displayCount = 1000 + (onlineCountReal || 0);

  // Global Trending Mix for Hero Carousel
  const heroDramas = useMemo(() => {
    const mix = [];
    
    // 2 top items from DramaBox
    if (popularDramas) {
       mix.push(...popularDramas.slice(0, 2).map((d: any) => ({ ...d, platform: "dramabox" })));
    }
    
    // 2 top items from ReelShort
    const rsBooks = (reelShortHome as any)?.data?.lists?.find((l: any) => l.books)?.books || (reelShortHome as any)?.lists?.find((l: any) => l.books)?.books;
    if (rsBooks) {
       mix.push(...rsBooks.slice(0, 2).map((d: any) => ({ ...d, platform: "reelshort" })));
    }

    // 1 item from FlickReels
    if (flickReelsHome?.data?.list) {
       mix.push(...flickReelsHome.data.list.slice(0, 1).map((d: any) => ({ ...d, platform: "flickreels" })));
    }

    // 1 item from ShortMax
    const smBooks = Array.isArray(shortMaxHome) ? shortMaxHome : (shortMaxHome as any)?.data;
    if (smBooks) {
       mix.push(...smBooks.slice(0, 1).map((d: any) => ({ ...d, platform: "shortmax" })));
    }

    // 1 item from Melolo
    if (meloloHome?.books) {
       mix.push(...meloloHome.books.slice(0, 1).map((d: any) => ({ ...d, platform: "melolo" })));
    }

    // 1 item from DramaNova
    if (dramanovaHome) {
       mix.push(...dramanovaHome.slice(0, 1).map((d: any) => ({ ...d, platform: "dramanova" })));
    }

     // 1 item from Velolo
     const veloloList = (veloloHome as any)?.pages?.[0] || veloloHome;
     if (Array.isArray(veloloList)) {
        mix.push(...veloloList.slice(0, 1).map((d: any) => ({ ...d, platform: "velolo" })));
     }

     // 1 item from StardustTV
     if (Array.isArray(stardustHome) && stardustHome.length > 0) {
        mix.push(...stardustHome.slice(0, 1).map((d: any) => ({ ...d, platform: "stardusttv" })));
     }

     // 1 item from DramaWave
     if (Array.isArray(dramawaveHome) && dramawaveHome.length > 0) {
        mix.push(...dramawaveHome.slice(0, 1).map((d: any) => ({ ...d, platform: "dramawave" })));
     }

    return mix;
  }, [popularDramas, reelShortHome, flickReelsHome, shortMaxHome, meloloHome, dramanovaHome, veloloHome, stardustHome, dramawaveHome]);

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-12 pb-20">
      {/* 1. Hero Section */}
      <HeroCarousel 
        dramas={heroDramas} 
        isLoading={loadingPopular || loadingReelShort} 
      />

      {/* 2. Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Zap} 
          label="TOTAL LIBRARY" 
          value="15.215+ Drama" 
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard 
          icon={Monitor} 
          label="KUALITAS" 
          value="HD / UHD" 
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
        <StatCard 
          icon={Star} 
          label="SUMBER" 
          value="Multi Platform" 
          color="text-yellow-500"
          bgColor="bg-yellow-500/10"
        />
        <StatCard 
          icon={Users} 
          label="USER ONLINE" 
          value={displayCount.toLocaleString('id-ID')} 
          isOnline={true}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
      </div>

      {/* 3. Multi-Platform Sections (9 Cards Each) */}
      <div className="space-y-16">
         {/* DRAMABOX */}
         <DramaSection
            title="DRAMABOX"
            dramas={latestDramas}
            isLoading={loadingLatest}
            platform="dramabox"
         />

         {/* REELSHORT */}
         <DramaSection
            title="REELSHORT"
            dramas={((reelShortHome as any)?.lists || (reelShortHome as any)?.data?.lists)?.find((l: any) => l.books)?.books || (Array.isArray(reelShortHome) ? reelShortHome : [])}
            isLoading={loadingReelShort}
            platform="reelshort"
         />

         {/* FLICKREELS */}
         <DramaSection
            title="FLICKREELS"
            dramas={flickReelsHome?.data?.list}
            isLoading={loadingFlickReels}
            platform="flickreels"
         />

         {/* SHORTMAX */}
         <DramaSection
            title="SHORTMAX"
            dramas={Array.isArray(shortMaxHome) ? shortMaxHome : (shortMaxHome as any)?.data}
            isLoading={loadingShortMax}
            platform="shortmax"
         />

         {/* MELOLO */}
         <DramaSection
            title="MELOLO"
            dramas={meloloHome?.books}
            isLoading={loadingMelolo}
            platform="melolo"
         />

         {/* DRAMANOVA */}
         <DramaSection
            title="DRAMANOVA"
            dramas={dramanovaHome}
            isLoading={loadingDramanova}
            platform="dramanova"
         />

         {/* VELOLO */}
         <DramaSection
            title="VELOLO"
            dramas={(veloloHome as any)?.pages?.[0] || veloloHome}
            isLoading={loadingVelolo}
            platform="velolo"
         />

         {/* STARDUSTTV */}
         <DramaSection
            title="STARDUSTTV"
            dramas={stardustHome}
            isLoading={loadingStardust}
            platform="stardusttv"
         />

         {/* DRAMAWAVE */}
         <DramaSection
            title="DRAMAWAVE"
            dramas={dramawaveHome}
            isLoading={loadingDramawave}
            platform="dramawave"
         />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  isOnline?: boolean;
}

function StatCard({ icon: Icon, label, value, color, bgColor, isOnline }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800/50 transition-all group overflow-hidden relative">
      <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", bgColor, color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-white font-bold md:text-lg tracking-tight">{value}</span>
          {isOnline && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow shadow-emerald-500/50" />}
        </div>
      </div>
      
      {/* Subtle Background Glow */}
      <div className={cn("absolute -bottom-8 -right-8 w-16 h-16 rounded-full blur-3xl opacity-20", bgColor)} />
    </div>
  );
}
