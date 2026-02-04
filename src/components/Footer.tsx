"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // Hide footer on watch pages for immersive video experience
  if (pathname?.startsWith("/watch")) {
    return null;
  }

  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-3">
          {/* Copyright */}
          <p className="text-xs text-muted-foreground/80 text-center font-medium">
            &copy; {new Date().getFullYear()} AE PRO Pusat Drama. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
