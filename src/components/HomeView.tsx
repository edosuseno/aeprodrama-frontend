"use client";
import { useMemo, useState, useEffect } from "react";

import { useForYouDramas, useLatestDramas } from "@/hooks/useDramas";
import { HeroCarousel } from "./HeroCarousel";
import { DramaSection } from "./DramaSection";
import { useReelShortHomepage } from "@/hooks/useReelShort";
import { useFlickReelsForYou } from "@/hooks/useFlickReels";
import { LucideIcon, Zap, Monitor, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnlineTracker } from "@/hooks/useStats";

export function HomeView() {
   const [isDeferredReady, setIsDeferredReady] = useState(false);
   useEffect(() => {
      const timer = setTimeout(() => setIsDeferredReady(true), 1500);
      return () => clearTimeout(timer);
   }, []);

   const { data: popularDramas, isLoading: loadingPopular } = useForYouDramas();
   const { data: latestDramas, isLoading: loadingLatest } = useLatestDramas();

   // Priority 1: Fetch Immediately (For Hero & Top Sections)
   const { data: reelShortHome, isLoading: loadingReelShort } = useReelShortHomepage();

   // Priority 2: Deferred Fetching (Wait 1 second)
   const { data: flickReelsHome, isLoading: loadingFlickReels } = useFlickReelsForYou(isDeferredReady);

   // Real-time Data from Backend (Real Count + Base 1000)
   const { data: onlineCountReal } = useOnlineTracker();

   // Base number for UI (Start from 1000 + actual visitors)
   const displayCount = 1000 + (onlineCountReal || 0);

   // Global Trending Mix for Hero Carousel - Optimized to only fetch from 3 top providers
   const heroDramas = useMemo(() => {
      const mix = [];
      
      // 1. Top 3 from DramaBox (Popular)
      if (popularDramas) {
         mix.push(...popularDramas.slice(0, 3).map((d: any) => ({ ...d, platform: "dramabox" })));
      }

      // 2. Top 2 from ReelShort
      if (reelShortHome) {
         mix.push(...reelShortHome.slice(0, 2).map((d: any) => ({ ...d, platform: "reelshort" })));
      }

      // 3. Top 1 from FlickReels
      if (flickReelsHome && (flickReelsHome as any).data?.list) {
         mix.push(...(flickReelsHome as any).data.list.slice(0, 1).map((d: any) => ({ ...d, platform: "flickreels" })));
      }

      return mix;
   }, [popularDramas, reelShortHome, flickReelsHome]);

   return (
      <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-8 md:space-y-12 pb-20">
         {/* 1. Hero Section */}
         <HeroCarousel
            dramas={heroDramas}
            isLoading={loadingPopular || loadingReelShort}
         />

         {/* 2. Stats Bar */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
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
         <div className="space-y-10 md:space-y-16">

            {/* DOTDRAMA */}
            <DramaSection
               title="DOTDRAMA"
               dramas={dotDramaHome}
               isLoading={loadingDotDrama}
               platform="dotdrama"
            />


            {/* SHORTMAX */}
            <DramaSection
               title="SHORTMAX"
               dramas={Array.isArray(shortMaxHome) ? shortMaxHome : (shortMaxHome as any)?.data}
               isLoading={loadingShortMax}
               platform="shortmax"
            />



            {/* VELOLO */}
            <DramaSection
               title="VELOLO"
               dramas={(veloloHome as any)?.pages?.[0] || veloloHome}
               isLoading={loadingVelolo}
               platform="velolo"
            />

            {/* RADREELS */}
            <DramaSection
               title="RADREELS"
               dramas={(radreelsHome as any)?.pages?.[0] || radreelsHome}
               isLoading={loadingRadreels}
               platform="radreels"
            />

            {/* MELOSHORT */}
            <DramaSection
               title="MELOSHORT"
               dramas={meloShortHome}
               isLoading={loadingMeloShort}
               platform="meloshort"
            />

            {/* STARDUSTTV */}
            <DramaSection
               title="STARDUSTTV"
               dramas={stardustHome}
               isLoading={loadingStardust}
               platform="stardusttv"
            />

            {/* IDRAMA */}
            <DramaSection
               title="IDRAMA"
               dramas={idrama2Home}
               isLoading={loadingIdrama2}
               platform="idrama2"
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
      <div className="flex items-center gap-2.5 md:gap-4 p-3 md:p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800/50 transition-all group overflow-hidden relative">
         <div className={cn("p-2 md:p-3 rounded-xl transition-transform group-hover:scale-110", bgColor, color)}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
         </div>
         <div className="flex flex-col min-w-0">
            <span className="text-[9px] md:text-[10px] font-black text-white/40 tracking-widest uppercase truncate">{label}</span>
            <div className="flex items-center gap-1">
               <span className="text-white font-bold text-sm md:text-lg tracking-tight truncate leading-tight">{value}</span>
               {isOnline && <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow shadow-emerald-500/50 shrink-0" />}
            </div>
         </div>

         {/* Subtle Background Glow */}
         <div className={cn("absolute -bottom-8 -right-8 w-16 h-16 rounded-full blur-3xl opacity-20", bgColor)} />
      </div>
   );
}
