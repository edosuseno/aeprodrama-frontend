import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ReelShortHomepageResponse,
  ReelShortSearchResponse,
} from "@/types/reelshort";

import { fetchJson } from "@/lib/fetcher";

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
export function useReelShortEpisode(bookId: string, episodeNumber: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ["reelshort", "episode", bookId, episodeNumber],
    queryFn: () => fetchJson(`${API_BASE}/watch?bookId=${bookId}&episodeNumber=${episodeNumber}`),
    enabled: enabled && !!bookId && episodeNumber > 0,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    gcTime: 1000 * 60 * 30, // Keep in memory for 30 minutes
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
