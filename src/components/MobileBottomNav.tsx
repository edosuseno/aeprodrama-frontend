"use client";

import { useState } from "react";
import { usePlatform } from "@/hooks/usePlatform";
import { cn } from "@/lib/utils";
import { Home, Search, LayoutGrid, Clock, User, X, Zap, Clapperboard } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export function MobileBottomNav() {
  const { currentPlatform, setPlatform, platforms } = usePlatform();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isHideNav = pathname?.includes("watch");

  if (isHideNav) return null;

  const NavItem = ({ href, icon: Icon, label, active, onClick }: any) => (
    <Link 
      href={href}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center flex-1 gap-1 transition-all",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn("w-6 h-6", active && "animate-bounce-subtle")} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-[90] flex items-center shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
        <div className="flex w-full items-center relative gap-2 px-2">
          <NavItem 
            href="/" 
            icon={Home} 
            label="Home" 
            active={(pathname === "/" && currentPlatform === "home") && !isModalOpen} 
            onClick={() => setPlatform("home")}
          />
          <button 
            onClick={(e) => {
               e.preventDefault();
               window.dispatchEvent(new Event('openSearch'));
            }}
            className={cn(
               "flex flex-col items-center justify-center flex-1 gap-1 transition-all",
               pathname === "/search" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-medium">Cari</span>
          </button>

          {/* Central Floating Button */}
          <div className="flex-1 flex justify-center -translate-y-6 relative pointer-events-none">
            <button
              onClick={() => setIsModalOpen(true)}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 pointer-events-auto",
                "bg-zinc-800/90 text-white backdrop-blur-md",
                "ring-2 ring-white/10 hover:bg-zinc-700",
                isModalOpen && "scale-90 opacity-80"
              )}
            >
              <Clapperboard className="w-6 h-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </button>
            <div className="absolute top-full mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter opacity-80">
              Platform
            </div>
          </div>

          <NavItem 
            href="/history" 
            icon={Clock} 
            label="Riwayat" 
            active={pathname === "/history"} 
          />
          <NavItem 
            href="/profile" 
            icon={User} 
            label="Saya" 
            active={pathname === "/profile"} 
          />
        </div>
      </nav>

      {/* PLATFORM LIST MODAL */}
      <div className={cn(
        "fixed inset-0 z-[100] transition-all duration-500 md:hidden",
        isModalOpen ? "visible opacity-100" : "invisible opacity-0"
      )}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        />
        
        {/* Floating Modal Content */}
        <div className={cn(
          "absolute m-auto inset-x-4 inset-y-0 h-fit max-h-[85vh] bg-[#191922] shadow-2xl rounded-[32px] border border-white/10 p-5 transition-transform duration-500 ease-out flex flex-col items-center",
          isModalOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}>
           <div className="flex items-start justify-between w-full mb-6 mt-2">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white shrink-0">
                    <Clapperboard className="w-6 h-6" />
                 </div>
                 <div className="flex flex-col">
                    <h3 className="text-base font-bold text-white tracking-wide">Pilihan Saluran</h3>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">Tentukan sumber drama favoritmu hari ini</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex flex-shrink-0 items-center justify-center hover:bg-white/20 transition-all ml-2 mt-1"
              >
                <X className="w-4 h-4 text-white/80" />
              </button>
           </div>

           {/* Platform Grid */}
           <div className="grid grid-cols-2 gap-2.5 w-full overflow-y-auto no-scrollbar pb-2">
              {platforms.filter(p => p.id !== "home").map((platform) => {
                const isActive = currentPlatform === platform.id;
                return (
                  <button
                    key={platform.id}
                    onClick={() => {
                      setPlatform(platform.id);
                      setIsModalOpen(false);
                      if (pathname !== "/") {
                        router.push("/");
                      }
                    }}
                    className={cn(
                      "group relative flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300",
                      isActive 
                        ? "bg-white/10 border border-white/20 shadow-glow-sm" 
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    )}
                  >
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={platform.logo}
                        alt={platform.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className={cn(
                        "font-medium text-[13px] truncate",
                        isActive ? "text-white font-bold" : "text-white/70"
                      )}>
                        {platform.name}
                      </div>
                    </div>
                  </button>
                );
              })}
           </div>
        </div>
      </div>
    </>
  );
}
