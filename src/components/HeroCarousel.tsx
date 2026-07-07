"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

interface HeroCarouselProps {
  dramas: any[] | undefined;
  isLoading?: boolean;
}

export function HeroCarousel({ dramas, isLoading }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const featuredDramas = useMemo(() => {
    if (!dramas) return [];
    return dramas.slice(0, 5); // Dibatasi 5 agar tidak menguras memori HP
  }, [dramas]);

  if (isLoading) {
    return (
      <div className="w-full aspect-[16/10] md:aspect-[25/9] bg-zinc-900 animate-pulse rounded-[2.5rem]" />
    );
  }

  if (featuredDramas.length === 0) return null;

  return (
    <div className="relative w-full group">
      <div className="overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-white/5" ref={emblaRef}>
        <div className="flex">
          {featuredDramas.map((drama, idx) => {
            const platform = drama.platform || "dramabox";
            const bookId = drama.playlet_id || drama.book_id || drama.bookId || drama.shortPlayId || drama.key || drama.id;
            const cover = drama.coverWap || drama.cover || drama.book_pic || drama.thumb_url || drama.shortPlayCover || drama.poster || drama.image;
            const title = drama.bookName || drama.book_title || drama.title || drama.book_name || drama.shortPlayName;
            const introduction = drama.introduction || drama.abstract || drama.desc || drama.description || "Nikmati tontonan berkualitas tinggi dengan alur cerita yang mendalam dan penuh emosi, hanya tersedia di DRACINDO.";
            
            return (
              <div key={idx} className="flex-[0_0_100%] min-w-0 relative h-full">
                <div className="relative w-full aspect-[16/10] md:aspect-[25/9]">
                  {/* Background Image */}
                  <img
                    src={cover && cover.trim()
                      ? (cover.includes('montagehub.xyz') || cover.includes('hikeuniverses.xyz') || cover.includes('sansekai') || cover.includes('stardusttv.cc') || cover.includes('idrama.video') || cover.includes('goodreels.com') || cover.includes('cubetv.cc') || cover.startsWith('http://')
                          ? `/api/image-proxy?url=${encodeURIComponent(cover)}`
                          : `https://wsrv.nl/?url=${encodeURIComponent(cover)}&w=1280&q=75&output=webp`
                        )
                      : "/placeholder-.svg"}
                    alt={title || ""}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    loading={idx === 0 ? "eager" : "lazy"}
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Premium Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-transparent z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                  
                  {/* Content Container */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 max-w-2xl">
                     <div className="flex items-center gap-3 mb-4 scale-90 md:scale-100 origin-left">
                        <span className="bg-primary/90 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] md:text-xs font-black tracking-tighter text-white uppercase italic">TRENDING NO.{idx + 1}</span>
                        <div className="flex items-center gap-1.5 py-1 px-2.5 bg-white/10 backdrop-blur-md rounded border border-white/10">
                           <Star className="w-3 md:w-4 h-3 md:h-4 text-primary fill-primary" />
                           <span className="text-[10px] md:text-sm font-black text-white">9.{9 - idx}</span>
                        </div>
                        <span className="bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-widest">{platform}</span>
                     </div>

                    <h2 className="text-2xl md:text-5xl lg:text-6xl font-black text-white mb-3 md:mb-5 line-clamp-2 leading-[1.1] tracking-tight drop-shadow-2xl">
                      {title}
                    </h2>
                    
                    <p className="text-white/60 text-xs md:text-sm lg:text-base mb-6 md:mb-8 line-clamp-2 md:line-clamp-3 max-w-md md:max-w-lg leading-relaxed mix-blend-lighten">
                      {introduction}
                    </p>
                    
                    <div className="flex items-center gap-3 md:gap-5">
                      <Link
                        href={`/watch/${platform}/${bookId}`}
                        className="flex items-center gap-2.5 px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/40 text-xs md:text-sm uppercase tracking-widest hover:opacity-90"
                      >
                        <Play className="w-4 md:w-5 h-4 md:h-5 fill-current" />
                        <span>PUTAR SEKARANG</span>
                      </Link>
                      
                      <Link
                        href={`/detail/${platform}/${bookId}`}
                        className="flex items-center justify-center w-12 md:w-16 h-12 md:h-16 bg-white/5 backdrop-blur-xl text-white border border-white/10 rounded-2xl font-bold hover:bg-white/15 transition-all group/info"
                      >
                        <Info className="w-6 md:w-7 h-6 md:h-7 group-hover/info:scale-110 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Indicators */}
      <div className="absolute right-6 md:right-16 bottom-6 md:bottom-12 z-30 flex items-center gap-6">
        <div className="flex gap-2">
          {featuredDramas.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "h-1.5 transition-all duration-500 rounded-full",
                selectedIndex === i ? "w-8 md:w-12 bg-primary" : "w-1.5 md:w-2 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>
        
        <div className="hidden md:flex gap-2">
           <button onClick={() => emblaApi?.scrollPrev()} className="p-2 md:p-3 rounded-xl bg-black/40 border border-white/10 text-white/50 hover:text-white hover:bg-black/60 transition-all">
              <ChevronLeft className="w-5 h-5" />
           </button>
           <button onClick={() => emblaApi?.scrollNext()} className="p-2 md:p-3 rounded-xl bg-black/40 border border-white/10 text-white/50 hover:text-white hover:bg-black/60 transition-all">
              <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      </div>
    </div>
  );
}
