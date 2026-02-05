import { useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { Drama } from "@/types/drama";
import type {
  ReelShortHomepageResponse,
  ReelShortSearchResponse,
} from "@/types/reelshort";

import { fetchJson } from "@/lib/fetcher";
import { decryptData } from "@/lib/crypto";

const API_BASE = "/api/reelshort";

export function useReelShortHomepage() {
  return useQuery({
    queryKey: ["reelshort", "homepage"],
    queryFn: () => fetchJson<ReelShortHomepageResponse>(`${API_BASE}/homepage`),
    staleTime: 1000 * 60 * 10, // Increased to 10 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
}

export function useReelShortSearch(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: ["reelshort", "search", normalizedQuery],
    queryFn: async () => {
      if (!normalizedQuery) return { success: true, data: [] };
      return fetchJson<ReelShortSearchResponse>(`${API_BASE}/search?query=${encodeURIComponent(normalizedQuery)}`);
    },
    enabled: normalizedQuery.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch and cache episode video data
 * This will cache the video URL for faster playback
 */
// Define types locally if not available globally
interface ReelShortEpisodeData {
  success: boolean;
  isLocked: boolean;
  videoList?: Array<{ url: string; encode: string; quality: number; bitrate: string }>;
  videoUrl?: string; // Legacy support
  title?: string;
  data?: any; // For encrypted response
}

export function useReelShortEpisode(bookId: string, episodeNumber: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ["reelshort", "episode", bookId, episodeNumber],
    queryFn: () => fetchJson<ReelShortEpisodeData>(`${API_BASE}/watch?bookId=${bookId}&episodeNumber=${episodeNumber}`),
    enabled: enabled && !!bookId && episodeNumber > 0,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    gcTime: 1000 * 60 * 30, // Keep in memory for 30 minutes
  });
}

export function useReelShortEpisodes(bookId: string) {
  return useQuery({
    queryKey: ["reelshort", "episodes", bookId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/allepisode/${bookId}`);
      if (!response.ok) throw new Error("Failed to fetch episodes");
      const json = await response.json();
      if (json.data && typeof json.data === "string") {
        return decryptData(json.data);
      }
      return json;
    },
    enabled: !!bookId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Prefetch next episode in the background
 */
export function usePrefetchReelShortEpisode() {
  const queryClient = useQueryClient();

  return (bookId: string, episodeNumber: number) => {
    queryClient.prefetchQuery({
      queryKey: ["reelshort", "episode", bookId, episodeNumber],
      queryFn: () => fetchJson(`${API_BASE}/watch?bookId=${bookId}&episodeNumber=${episodeNumber}`),
      staleTime: 1000 * 60 * 10,
    });
  };
}

export function useInfiniteReelShort() {
  return useInfiniteQuery({
    queryKey: ["reelshort", "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`${API_BASE}/explore?page=${pageParam}`);
      const json = await res.json();
      let items: any[] = [];

      if (json.data && typeof json.data === "string") {
        items = decryptData(json.data);
      } else {
        items = json.data || json;
      }

      // Final safety check to ensure we return an array
      if (items && !Array.isArray(items)) {
        if ((items as any).lists) items = (items as any).lists;
        else if ((items as any).items) items = (items as any).items;
        else items = [];
      }

      return (items || []) as Drama[];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 5) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 60 * 5,
  });
}
