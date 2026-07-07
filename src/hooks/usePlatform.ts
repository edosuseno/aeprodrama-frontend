"use client";

import { create } from "zustand";

export type Platform = "home" | "dramabox" | "reelshort" | "netshort" | "shortmax" | "melolo" | "flickreels" | "freereels" | "moviebox" | "stardusttv" | "dramawave" | "dramanova" | "velolo" | "dotdrama" | "goodshort" | "meloshort" | "idrama2" | "vigloo" | "radreels" | "flextv" | "reelife" | "pine" | "shortwave2" | "shortsky" | "cubetv";

export type ProviderStatus = "active" | "maintenance" | "offline" | "coming_soon";

export interface PlatformInfo {
  id: Platform;
  name: string;
  logo: string;
  apiBase: string;
  status?: ProviderStatus;
}

export const PLATFORMS: PlatformInfo[] = [
  {
    id: "home",
    name: "Beranda",
    logo: "/logo.png?v=6",
    apiBase: "",
  },
  {
    id: "dramabox",
    name: "DramaBox",
    logo: "/dramabox.webp",
    apiBase: "/api/dramabox",
  },
  {
    id: "reelshort",
    name: "ReelShort",
    logo: "/reelshort.webp",
    apiBase: "/api/reelshort",
  },
  {
    id: "netshort",
    name: "NetShort",
    logo: "/netshort.webp",
    apiBase: "/api/netshort",
  },
  {
    id: "shortmax",
    name: "ShortMax",
    logo: "/shortmax.png",
    apiBase: "/api/shortmax",
  },
  {
    id: "melolo",
    name: "Melolo",
    logo: "/melolo.webp",
    apiBase: "/api/melolo",
  },
  {
    id: "flickreels",
    name: "FlickReels",
    logo: "/flickreels.png",
    apiBase: "/api/flickreels",
    status: "coming_soon",
  },
  {
    id: "freereels",
    name: "FreeReels",
    logo: "/freereels.webp",
    apiBase: "/api/freereels",
  },
  {
    id: "cubetv",
    name: "CubeTV",
    logo: "/cubetv.png",
    apiBase: "/api/cubetv",
  },
  {
    id: "moviebox",
    name: "MovieBox",
    logo: "/moviebox.png",
    apiBase: "/api/moviebox",
  },
  {
    id: "stardusttv",
    name: "StardustTV",
    logo: "https://gkcnbnlfqdlotnjaizxx.supabase.co/storage/v1/object/public/provider-logos/stardusttv.webp", 
    apiBase: "/api/stardusttv",
  },
  {
    id: "dramawave",
    name: "DramaWave",
    logo: "https://gkcnbnlfqdlotnjaizxx.supabase.co/storage/v1/object/public/provider-logos/dramawave.webp",
    apiBase: "/api/dramawave",
  },
  {
    id: "dramanova",
    name: "DramaNova",
    logo: "https://gkcnbnlfqdlotnjaizxx.supabase.co/storage/v1/object/public/provider-logos/dramanova.webp",
    apiBase: "/api/dramanova",
  },
  {
    id: "velolo",
    name: "Velolo",
    logo: "https://gkcnbnlfqdlotnjaizxx.supabase.co/storage/v1/object/public/provider-logos/velolo.webp",
    apiBase: "/api/velolo",
  },
  {
    id: "dotdrama",
    name: "Dot Drama",
    logo: "https://gkcnbnlfqdlotnjaizxx.supabase.co/storage/v1/object/public/provider-logos/dotdrama.webp",
    apiBase: "/api/dotdrama",
  },
  {
    id: "goodshort",
    name: "GoodShort",
    logo: "https://gkcnbnlfqdlotnjaizxx.supabase.co/storage/v1/object/public/provider-logos/goodshort.webp",
    apiBase: "/api/goodshort",
    status: "coming_soon",
  },
  {
    id: "meloshort",
    name: "MeloShort",
    logo: "https://gkcnbnlfqdlotnjaizxx.supabase.co/storage/v1/object/public/provider-logos/meloshort.webp",
    apiBase: "/api/meloshort",
  },
  {
    id: "idrama2",
    name: "iDrama",
    logo: "https://gkcnbnlfqdlotnjaizxx.supabase.co/storage/v1/object/public/provider-logos/idrama.webp",
    apiBase: "/api/idrama2",
  },
  {
    id: "vigloo",
    name: "Vigloo",
    logo: "https://gkcnbnlfqdlotnjaizxx.supabase.co/storage/v1/object/public/provider-logos/vigloo.webp",
    apiBase: "/api/vigloo",
  },
  {
    id: "radreels",
    name: "RadReels",
    logo: "/radreels.png",
    apiBase: "/api/radreels",
  },
  {
    id: "flextv",
    name: "FlexTV",
    logo: "https://gkcnbnlfqdlotnjaizxx.supabase.co/storage/v1/object/public/provider-logos/flextv.webp",
    apiBase: "/api/flextv",
  },
  {
    id: "reelife",
    name: "Reelife",
    logo: "/reelife.webp",
    apiBase: "/api/reelife",
  },
  {
    id: "pine",
    name: "PineDrama",
    logo: "/pine.png",
    apiBase: "/api/pine",
  },
  {
    id: "shortwave2",
    name: "Shortwave",
    logo: "https://storage.vidrama.asia/providers/shortwave2.webp",
    apiBase: "/api/shortwave2",
    status: "maintenance"
  },
  {
    id: "shortsky",
    name: "ShortSky",
    logo: "https://storage.vidrama.asia/providers/shortsky.webp",
    apiBase: "/api/shortsky"
  }
];

interface PlatformState {
  currentPlatform: Platform;
  setPlatform: (platform: Platform) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  currentPlatform: "home",
  setPlatform: (platform) => set({ currentPlatform: platform }),
}));

export function usePlatform() {
  const { currentPlatform, setPlatform } = usePlatformStore();
  const platformInfo = PLATFORMS.find((p) => p.id === currentPlatform) || PLATFORMS[0];

  const getPlatformInfo = (platformId: Platform) => {
    return PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[0];
  };

  return {
    currentPlatform,
    platformInfo,
    setPlatform,
    platforms: PLATFORMS,
    getPlatformInfo,
    isHome: currentPlatform === "home",
    isDramaBox: currentPlatform === "dramabox",
    isReelShort: currentPlatform === "reelshort",
    isNetShort: currentPlatform === "netshort",
    isShortMax: currentPlatform === "shortmax",
    isMelolo: currentPlatform === "melolo",
    isFlickReels: currentPlatform === "flickreels",
    isFreeReels: currentPlatform === "freereels",
    isMovieBox: currentPlatform === "moviebox",
    isStardustTV: currentPlatform === "stardusttv",
    isDramaWave: currentPlatform === "dramawave",
    isDramaNova: currentPlatform === "dramanova",
    isVelolo: currentPlatform === "velolo",
    isDotDrama: currentPlatform === "dotdrama",
    isGoodShort: currentPlatform === "goodshort",
    isMeloShort: currentPlatform === "meloshort",
    isIdrama2: currentPlatform === "idrama2",
    isVigloo: currentPlatform === "vigloo",
    isRadreels: currentPlatform === "radreels",
    isFlexTV: currentPlatform === "flextv",
    isReelife: currentPlatform === "reelife",
    isPine: currentPlatform === "pine",
    isShortwave2: currentPlatform === "shortwave2",
    isShortsky: currentPlatform === "shortsky",
    isCubetv: currentPlatform === "cubetv",
  };
}
