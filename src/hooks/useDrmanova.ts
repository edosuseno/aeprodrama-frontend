
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export interface DrmanovaDrama {
  id: string;
  title: string;
  cover: string;
  chapterCount?: number;
  provider?: string;
  [key: string]: any;
}

export interface DrmanovaEpisode {
  chapterId: string | number;
  realId: string;
  chapterIndex: number;
  title: string;
  fileName?: string;
  isLocked: boolean;
  [key: string]: any;
}

export interface DrmanovaDetailResponse {
  id: string;
  title: string;
  cover: string;
  introduction: string;
  episodes: DrmanovaEpisode[];
  [key: string]: any;
}

export function useDrmanovaExplore(page = 1, category = 'all') {
    return useQuery<DrmanovaDrama[]>({
        queryKey: ["dramanova", "explore", page, category],
        queryFn: () => fetchJson<DrmanovaDrama[]>(`/api/dramanova/explore?page=${page}&category=${category}`),
        staleTime: 5 * 60 * 1000,
    });
}

export function useDrmanovaDetail(id: string) {
    return useQuery<DrmanovaDetailResponse>({
        queryKey: ["dramanova", "detail", id],
        queryFn: () => fetchJson<DrmanovaDetailResponse>(`/api/dramanova/detail?id=${id}`),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useDrmanovaSearch(query: string) {
    return useQuery<DrmanovaDrama[]>({
        queryKey: ["dramanova", "search", query],
        queryFn: () => fetchJson<DrmanovaDrama[]>(`/api/dramanova/search?query=${encodeURIComponent(query)}`),
        enabled: !!query,
        staleTime: 60 * 1000,
    });
}

export function useDrmanovaStream(id: string, episodeIndex: number) {
    return useQuery<string>({
        queryKey: ["dramanova", "stream", id, episodeIndex],
        queryFn: () => fetchJson<string>(`/api/dramanova/watch?id=${id}&episodeIndex=${episodeIndex}`),
        enabled: !!id && !!episodeIndex,
        staleTime: 5 * 60 * 1000,
    });
}

import { useInfiniteQuery } from "@tanstack/react-query";

export function useInfiniteDrmanova(category = 'all') {
  return useInfiniteQuery({
    queryKey: ["dramanova", "infinite", category],
    queryFn: ({ pageParam = 1 }) =>
      fetchJson<DrmanovaDrama[]>(`/api/dramanova/explore?page=${pageParam}&category=${category}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // DRAMANOVA API returns page lists, typically 10-20 items
      if (!lastPage || lastPage.length < 5) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 60 * 5,
  });
}
