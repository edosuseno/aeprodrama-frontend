
"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export interface DramaWaveDrama {
  shortPlayId: string;
  shortPlayName: string;
  cover: string;
  tags?: string[];
  playCount?: string | number;
  [key: string]: any;
}

export interface DramaWaveEpisode {
  title: string;
  [key: string]: any;
}

export interface DramaWaveDetailResponse {
  shortPlayId: string;
  shortPlayName: string;
  cover: string;
  description: string;
  episodes: DramaWaveEpisode[];
  tags: string[];
  [key: string]: any;
}

export interface DramaWaveStream {
  url: string;
  subtitle?: string;
  [key: string]: any;
}

export function useDramaWaveExplore(page = 1, category = 'popular') {
    return useQuery<DramaWaveDrama[]>({
        queryKey: ["dramawave", "explore", page, category],
        queryFn: () => fetchJson<DramaWaveDrama[]>(`/api/dramawave/explore?page=${page}&category=${category}`),
        staleTime: 5 * 60 * 1000,
    });
}

export function useDramaWaveDetail(shortPlayId: string) {
    return useQuery<DramaWaveDetailResponse>({
        queryKey: ["dramawave", "detail", shortPlayId],
        queryFn: () => fetchJson<DramaWaveDetailResponse>(`/api/dramawave/detail?shortPlayId=${shortPlayId}`),
        enabled: !!shortPlayId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useDramaWaveSearch(query: string) {
    return useQuery<DramaWaveDrama[]>({
        queryKey: ["dramawave", "search", query],
        queryFn: () => fetchJson<DramaWaveDrama[]>(`/api/dramawave/search?query=${encodeURIComponent(query)}`),
        enabled: !!query,
        staleTime: 60 * 1000,
    });
}

export function useDramaWaveStream(shortPlayId: string, episodeNo: number) {
    return useQuery<DramaWaveStream>({
        queryKey: ["dramawave", "stream", shortPlayId, episodeNo],
        queryFn: () => fetchJson<DramaWaveStream>(`/api/dramawave/stream?shortPlayId=${shortPlayId}&episodeNo=${episodeNo}`),
        enabled: !!shortPlayId,
        staleTime: 60 * 1000,
    });
}

export function useInfiniteDramaWave(category = 'popular') {
  return useInfiniteQuery({
    queryKey: ["dramawave", "infinite", category],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await fetchJson<DramaWaveDrama[]>(`/api/dramawave/explore?page=${pageParam}&category=${category}`);
      return data || [];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 30) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 60 * 5,
  });
}
