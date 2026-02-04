import { useQuery } from "@tanstack/react-query";
import type { DramaDetailResponse, Episode } from "@/types/drama";

const API_BASE = "/api/dramabox";

import { decryptData } from "@/lib/crypto";

async function fetchDramaDetail(bookId: string): Promise<DramaDetailResponse> {
  const response = await fetch(`${API_BASE}/detail/${bookId}?lang=in`);
  if (!response.ok) {
    throw new Error("Failed to fetch drama detail");
  }
  const json = await response.json();
  if (json.data && typeof json.data === "string") {
    return decryptData(json.data);
  }
  return json;
}

async function fetchAllEpisodes(bookId: string): Promise<Episode[]> {
  const response = await fetch(`${API_BASE}/allepisode/${bookId}?lang=in`);
  if (!response.ok) {
    throw new Error("Failed to fetch episodes");
  }
  const json = await response.json();
  if (json.data && typeof json.data === "string") {
    return decryptData(json.data);
  }
  return json;
}

export function useDramaDetail(bookId: string) {
  return useQuery({
    queryKey: ["drama", "detail", bookId],
    queryFn: () => fetchDramaDetail(bookId),
    enabled: !!bookId,
    staleTime: 1000 * 60 * 10, // Increased to 10 minutes for better caching
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
}

export function useEpisodes(bookId: string) {
  return useQuery({
    queryKey: ["drama", "episodes", bookId],
    queryFn: () => fetchAllEpisodes(bookId),
    enabled: !!bookId,
    staleTime: 1000 * 60 * 10, // Increased to 10 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
}

/**
 * Prefetch video URL for specific episode
 * This will be called in the background to prepare next episodes
 */
export async function prefetchEpisodeVideo(bookId: string, chapterId: string) {
  try {
    const response = await fetch(`${API_BASE}/play/${bookId}/${chapterId}`);
    if (response.ok) {
      const json = await response.json();
      if (json.data && typeof json.data === "string") {
        return decryptData(json.data);
      }
      return json;
    }
  } catch (e) {
    console.log(`Prefetch failed for ${bookId}/${chapterId}`);
  }
  return null;
}
