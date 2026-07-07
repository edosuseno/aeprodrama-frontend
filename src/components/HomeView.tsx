"use client";
import { useMemo, useState, useEffect, useRef } from "react";

import { HeroCarousel } from "./HeroCarousel";
import { DramaSection } from "./DramaSection";
import { useNetShortForYou } from "@/hooks/useNetShort";
import { useShortMaxLatest } from "@/hooks/useShortMax";
import { useCubetvExplore } from "@/hooks/useCubetv";
import { useDotDramaExplore } from "@/hooks/useDotDrama";
import { useMeloloTrending } from "@/hooks/useMelolo";
import { useFlexTVExplore } from "@/hooks/useFlexTV";
import { useReelifeExplore } from "@/hooks/useReelife";
import { useDrmanovaExplore } from "@/hooks/useDrmanova";
import { useStardustTVExplore } from "@/hooks/useStardustTV";
import { LucideIcon, Zap, Monitor, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnlineTracker } from "@/hooks/useStats";

export function HomeView() {
   const [isDeferredReady, setIsDeferredReady] = useState(false);
   useEffect(() => {
      const timer = setTimeout(() => setIsDeferredReady(true), 1000);
      return () => clearTimeout(timer);
   }, []);

   // Priority 1: Fetch Immediately (For Hero & Top Sections)
   const { data: dramanovaHome, isLoading: loadingDramanova } = useDrmanovaExplore(1, 'all');
   const { data: stardustHome, isLoading: loadingStardust } = useStardustTVExplore(1);
   const { data: netshortHome, isLoading: loadingNetshort } = useNetShortForYou(1);

   // Real-time Data from Backend (Real Count + Base 1000)
   const { data: onlineCountReal } = useOnlineTracker();

   // Base number for UI (Start from 1000 + actual visitors)
   const displayCount = 1000 + (onlineCountReal || 0);

   // Global Trending Mix for Hero Carousel - Optimized to only fetch from 3 top providers
   const heroDramas = useMemo(() => {
      const mix = [];
      
      // 1. Top 2 from Dramanova
      const novaList = (dramanovaHome as any)?.list || dramanovaHome;
      if (novaList && Array.isArray(novaList)) {
         mix.push(...novaList.slice(0, 2).map((d: any) => ({ ...d, platform: "dramanova" })));
      }

      // 2. Top 2 from StardustTV
      if (stardustHome && Array.isArray(stardustHome)) {
         mix.push(...stardustHome.slice(0, 2).map((d: any) => ({ ...d, platform: "stardusttv" })));
      }

      // 3. Top 1 from NetShort
      const nsList = (netshortHome as any)?.data || netshortHome;
      if (nsList && Array.isArray(nsList)) {
         mix.push(...nsList.slice(0, 1).map((d: any) => ({ ...d, platform: "netshort" })));
      }

      return mix;
   }, [dramanovaHome, stardustHome, netshortHome]);

   return (
      <div className="w-full max-w-[1700px] mx-auto px-4 md:px-10 py-6 space-y-8 md:space-y-12 pb-20">
         {/* 1. Hero Section */}
         <HeroCarousel
            dramas={heroDramas}
            isLoading={loadingDramanova || loadingStardust}
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
               label="PLATFORM"
               value="18+ Apps"
               color="text-purple-500"
               bgColor="bg-purple-500/10"
            />
            <StatCard
               icon={Star}
               label="VIP ACCESS"
               value="100% Free"
               color="text-amber-500"
               bgColor="bg-amber-500/10"
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

         {/* 3. Multi-Platform Sections (Requested by User) */}
         <div className="space-y-10 md:space-y-16">
            <DramaSection title="DRAMANOVA" platform="dramanova" dramas={(dramanovaHome as any)?.list || dramanovaHome} isLoading={loadingDramanova} />
            <DramaSection title="STARDUSTTV" platform="stardusttv" dramas={stardustHome} isLoading={loadingStardust} />
            <DramaSection title="NETSHORT" platform="netshort" dramas={(netshortHome as any)?.data || netshortHome} isLoading={loadingNetshort} />
            
            {/* User Requested Providers Loaded Lazily */}
            <LazySection><ShortMaxSection /></LazySection>
            <LazySection><CubeTVSection /></LazySection>
            <LazySection><DotDramaSection /></LazySection>
            <LazySection><MeloloSection /></LazySection>
            <LazySection><FlexTVSection /></LazySection>
            <LazySection><ReelifeSection /></LazySection>
         </div>
      </div>
   );
}

// ----------------------------------------------------
// LAZY LOADING WRAPPERS
// ----------------------------------------------------

function LazySection({ children }: { children: React.ReactNode }) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { rootMargin: "300px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="min-h-[300px]">{inView && children}</div>;
}

function DramanovaSection() {
   const { data, isLoading } = useDrmanovaExplore(1, 'all');
   return <DramaSection title="DRAMANOVA" platform="dramanova" dramas={(data as any)?.list || data} isLoading={isLoading} />;
}
function StardustSection() {
   const { data, isLoading } = useStardustTVExplore(1);
   return <DramaSection title="STARDUSTTV" platform="stardusttv" dramas={data} isLoading={isLoading} />;
}
function NetShortSection() {
   const { data, isLoading } = useNetShortForYou(1);
   return <DramaSection title="NETSHORT" platform="netshort" dramas={(data as any)?.data || data} isLoading={isLoading} />;
}
function ShortMaxSection() {
   const { data, isLoading } = useShortMaxLatest();
   return <DramaSection title="SHORTMAX" platform="shortmax" dramas={Array.isArray(data) ? data : (data as any)?.data} isLoading={isLoading} />;
}
function CubeTVSection() {
   const { data, isLoading } = useCubetvExplore(1);
   return <DramaSection title="CUBETV" platform="cubetv" dramas={(data as any)?.data?.list || data} isLoading={isLoading} />;
}
function DotDramaSection() {
   const { data, isLoading } = useDotDramaExplore(1);
   return <DramaSection title="DOTDRAMA" platform="dotdrama" dramas={data} isLoading={isLoading} />;
}
function MeloloSection() {
   const { data, isLoading } = useMeloloTrending();
   return <DramaSection title="MELOLO" platform="melolo" dramas={(data as any)?.books || data} isLoading={isLoading} />;
}
function FlexTVSection() {
   const { data, isLoading } = useFlexTVExplore(1);
   return <DramaSection title="FLEXTV" platform="flextv" dramas={(data as any)?.data || data} isLoading={isLoading} />;
}
function ReelifeSection() {
   const { data, isLoading } = useReelifeExplore(1);
   return <DramaSection title="REELIFE" platform="reelife" dramas={(data as any)?.data || data} isLoading={isLoading} />;
}

// ----------------------------------------------------
// UI COMPONENTS
// ----------------------------------------------------

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
