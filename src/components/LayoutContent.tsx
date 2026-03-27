"use client";

import { useSidebarStore } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebarStore();
  const pathname = usePathname();
  const isWatchPage = pathname?.includes("/watch/");

  if (isWatchPage) {
    return (
      <div className="flex min-h-screen bg-black">
        <main className="flex-1 w-full h-full relative">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
        isExpanded ? "md:pl-[240px]" : "md:pl-[80px]"
      )}>
        <Suspense fallback={<div className="h-16" />}>
          <Header />
        </Suspense>
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    </div>
  );
}
