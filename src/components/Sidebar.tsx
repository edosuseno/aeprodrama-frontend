
"use client";

import Image from "next/image";
import { usePlatform } from "@/hooks/usePlatform";
import { useSidebarStore } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";
import { Home, LogIn, UserPlus, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Sidebar() {
  const { currentPlatform, setPlatform, platforms } = usePlatform();
  const { isExpanded } = useSidebarStore();
  const pathname = usePathname();
  const router = useRouter();

  const handlePlatformClick = (id: string) => {
    setPlatform(id as any);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const isWatchPage = pathname?.includes("watch");
  if (isWatchPage) return null;

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside 
        className={cn(
          "hidden md:flex fixed left-0 top-0 bottom-0 flex-col bg-card/60 backdrop-blur-xl border-r border-border z-[60] transition-all duration-300 ease-in-out shadow-2xl overflow-hidden",
          isExpanded ? "w-[240px]" : "w-[80px]"
        )}
      >
        {/* Top Fixed: Main Navigation */}
        <div className="pt-20 px-3 space-y-1 shrink-0">
          <button 
            onClick={() => handlePlatformClick("home")}
            className={cn(
              "w-full flex items-center h-12 px-3 rounded-xl transition-all group",
              currentPlatform === "home" ? "bg-primary/10 text-primary font-bold shadow-glow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Home className="w-6 h-6 shrink-0" />
            <span className={cn(
              "ml-4 font-medium transition-all duration-300 whitespace-nowrap",
              isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>Beranda</span>
          </button>

          <Link 
            href="/history"
            className={cn(
              "flex items-center h-12 px-3 rounded-xl transition-all group",
              pathname === "/history" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Clock className="w-6 h-6 shrink-0" />
            <span className={cn(
              "ml-4 font-medium transition-all duration-300 whitespace-nowrap",
              isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>Riwayat</span>
          </Link>
        </div>

        {/* Middle Scrollable: Providers List */}
        <div className="flex-1 mt-6 overflow-y-auto overflow-x-hidden no-scrollbar">
          <div className={cn(
            "px-6 mb-2 text-[10px] font-bold text-[#b3b3b3] uppercase tracking-widest transition-opacity",
            isExpanded ? "opacity-100" : "opacity-0 select-none"
          )}>
            Providers
          </div>
          
          <div className="px-3 space-y-1 pb-10">
            {platforms.filter(p => p.id !== "home").map((platform) => {
              const isActive = currentPlatform === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformClick(platform.id)}
                  className={cn(
                    "w-full flex items-center h-12 px-3 rounded-xl transition-all duration-300 group relative",
                    isActive 
                      ? "bg-primary/20 text-primary shadow-glow-sm" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "relative w-6 h-6 rounded-lg overflow-hidden shrink-0 transition-all duration-300",
                    isActive ? "ring-2 ring-primary/50 shadow-glow-sm scale-110" : "opacity-100 group-hover:scale-105"
                  )}>
                    <Image
                      src={platform.logo}
                      alt={platform.name}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>

                  <span className={cn(
                    "ml-4 font-medium text-sm transition-all duration-300 whitespace-nowrap",
                    isExpanded ? "opacity-100" : "opacity-0 pointer-events-none",
                    isActive ? "font-bold text-primary" : ""
                  )}>
                    {platform.name}
                  </span>

                  {isActive && !isExpanded && (
                    <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-glow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Fixed Area: Account */}
        <div className="p-3 border-t border-border bg-card/40 shrink-0">
          <div className="space-y-1">
            <button className="w-full flex items-center h-12 px-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all">
              <LogIn className="w-6 h-6 shrink-0" />
              <span className={cn(
                "ml-4 font-medium transition-all duration-300 whitespace-nowrap",
                isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>Masuk</span>
            </button>
            <button className="w-full h-12 flex items-center px-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all font-bold text-sm shadow-lg shadow-primary/20">
              <UserPlus className="w-6 h-6 shrink-0" />
              <span className={cn(
                "ml-4 transition-all duration-300 whitespace-nowrap",
                isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>Daftar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
