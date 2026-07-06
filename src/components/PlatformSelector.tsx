"use client";

import Image from "next/image";
import { ChevronDown, Lock } from "lucide-react";
import { usePlatform, type PlatformInfo } from "@/hooks/usePlatform";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function PlatformSelector() {
  const { currentPlatform, setPlatform, platforms, getPlatformInfo } = usePlatform();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  const currentPlatformInfo = getPlatformInfo(currentPlatform);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full py-4 px-4">
      {/* Mobile: Dropdown */}
      <div className="block md:hidden" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 rounded-md overflow-hidden">
              <Image
                src={currentPlatformInfo.logo}
                alt={currentPlatformInfo.name}
                fill
                className="object-cover"
                sizes="24px"
              />
            </div>
            <span className="font-medium text-foreground">
              {currentPlatformInfo.name}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-4 right-4 mt-2 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => {
                  if (platform.status === "maintenance") {
                    toast({ title: "Sedang Perbaikan", description: "Provider ini sedang dalam maintenance, beberapa fitur mungkin belum normal." });
                  }
                  if (platform.status === "offline") {
                    toast({ title: "Sedang Offline", description: "Provider ini sedang offline dan tidak dapat diakses.", variant: "destructive" });
                    return;
                  }
                  if (platform.status === "coming_soon") {
                    toast({ title: "Coming Soon", description: "Provider ini akan segera hadir, nantikan!" });
                    return;
                  }

                  setPlatform(platform.id);
                  setIsOpen(false);
                  if (pathname !== "/") {
                    router.push("/");
                  }
                }}
                className={`w-full relative flex items-center gap-3 px-4 py-3 transition-colors ${
                  currentPlatform === platform.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted/50'
                }`}
              >
                {/* Unified Status Badge at Top Right (Flush to corner) */}
                {platform.status === "maintenance" && (
                  <div className="absolute top-0 right-0 bg-orange-500/20 border-l border-b border-orange-500/20 text-orange-400 text-[8px] px-2 py-0.5 rounded-bl-lg font-bold uppercase flex items-center">
                    MT
                  </div>
                )}
                {platform.status === "offline" && (
                  <div className="absolute top-0 right-0 bg-red-500/20 border-l border-b border-red-500/20 text-red-400 text-[8px] px-2 py-0.5 rounded-bl-lg font-bold uppercase flex items-center">
                    OFF
                  </div>
                )}
                {platform.status === "coming_soon" && (
                  <div className="absolute top-0 right-0 bg-white/10 border-l border-b border-white/5 text-white/50 text-[8px] px-2 py-0.5 rounded-bl-lg font-bold uppercase flex items-center">
                    SOON
                  </div>
                )}

                <div className="relative w-6 h-6 rounded-md overflow-hidden shrink-0">
                  <Image
                    src={platform.logo}
                    alt={platform.name}
                    fill
                    className={`object-cover ${platform.status === "coming_soon" ? "opacity-50 grayscale" : ""}`}
                    sizes="24px"
                  />
                </div>
                <div className="flex flex-col items-start pr-6">
                  <span className="font-medium leading-none">{platform.name}</span>
                </div>
                {currentPlatform === platform.id && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Horizontal tabs */}
      <div className="hidden md:flex items-center gap-3">
        {platforms.map((platform) => (
          <PlatformButton
            key={platform.id}
            platform={platform}
            isActive={currentPlatform === platform.id}
            onClick={() => {
              if (platform.status === "maintenance") {
                toast({ title: "Sedang Perbaikan", description: "Provider ini sedang dalam maintenance, beberapa fitur mungkin belum normal." });
              }
              if (platform.status === "offline") {
                toast({ title: "Sedang Offline", description: "Provider ini sedang offline dan tidak dapat diakses.", variant: "destructive" });
                return;
              }
              if (platform.status === "coming_soon") {
                toast({ title: "Coming Soon", description: "Provider ini akan segera hadir, nantikan!" });
                return;
              }

              setPlatform(platform.id);
              if (pathname !== "/") {
                router.push("/");
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface PlatformButtonProps {
  platform: PlatformInfo;
  isActive: boolean;
  onClick: () => void;
}

function PlatformButton({ platform, isActive, onClick }: PlatformButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-4 py-2.5 rounded-full
        transition-all duration-300 ease-out
        ${
          isActive
            ? "bg-primary/20 ring-2 ring-primary shadow-lg shadow-primary/20"
            : "bg-muted/50 hover:bg-muted/80"
        }
      `}
    >
      {/* Unified Status Badge at Top Right (Flush to pill border) */}
      {platform.status === "maintenance" && (
        <div className="absolute top-0 right-0 bg-orange-500/20 border-l border-b border-orange-500/20 text-orange-400 text-[8px] px-2 py-0.5 rounded-tr-full rounded-bl-lg font-bold uppercase flex items-center">
          MT
        </div>
      )}
      {platform.status === "offline" && (
        <div className="absolute top-0 right-0 bg-red-500/20 border-l border-b border-red-500/20 text-red-400 text-[8px] px-2 py-0.5 rounded-tr-full rounded-bl-lg font-bold uppercase flex items-center">
          OFF
        </div>
      )}
      {platform.status === "coming_soon" && (
        <div className="absolute top-0 right-0 bg-white/10 border-l border-b border-white/5 text-white/50 text-[8px] px-2 py-0.5 rounded-tr-full rounded-bl-lg font-bold uppercase flex items-center">
          SOON
        </div>
      )}

      <div className="relative w-6 h-6 rounded-md overflow-hidden shrink-0">
        <Image
          src={platform.logo}
          alt={platform.name}
          fill
          className={`object-cover ${platform.status === "coming_soon" ? "opacity-50 grayscale" : ""}`}
          sizes="24px"
        />
      </div>
      <div className="flex flex-col items-start leading-none pr-1">
        <span
          className={`
            font-medium text-sm whitespace-nowrap
            ${isActive ? "text-primary" : "text-muted-foreground"}
          `}
        >
          {platform.name}
        </span>
      </div>
      {isActive && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}
    </button>
  );
}
