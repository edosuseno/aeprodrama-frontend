"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export interface CubetvEpisode {
  id: string | number;
  chapterId: string | number;
  title: string;
  episodeNo: number;
  index: number;
  is_free: number;
  videoUrl: string;
  subtitle: string;
  duration: number;
  [key: string]: any;
}

export interface CubetvDetailResponse {
  id: string;
  title: string;
  poster: string;
  description: string;
  totalEpisodes: number;
  episodes: CubetvEpisode[];
  tags?: string[];
  isEnd?: number;
  [key: string]: any;
}

export function useCubetvExplore(page = 1) {
    return useQuery<any[]>({
        queryKey: ["CubeTV", "explore", page],
        queryFn: async () => {
            const res = await fetchJson<any>(`/api/cubetv/explore?page=${page}`);
            return res?.data || res || [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useInfiniteCubetv() {
  return useInfiniteQuery({
    queryKey: ["CubeTV", "infinite"],
    queryFn: async ({ pageParam = 1 }: { pageParam: number }) => {
      const response = await fetchJson<any>(`/api/cubetv/explore?page=${pageParam}`);
      return {
        items: response?.data || response || [],
        page: pageParam
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.items.length < 10) return undefined;
      return lastPage.page + 1;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCubetvDetail(shortPlayId: string) {
    return useQuery<CubetvDetailResponse>({
        queryKey: ["CubeTV", "detail", shortPlayId],
        queryFn: async () => {
            const res = await fetchJson<any>(`/api/cubetv/detail?shortPlayId=${shortPlayId}`);
            return res?.data || res;
        },
        enabled: !!shortPlayId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCubetvSearch(keyword: string) {
    return useQuery<any[]>({
        queryKey: ["CubeTV", "search", keyword],
        queryFn: async () => {
            const res = await fetchJson<any>(`/api/cubetv/search?keyword=${encodeURIComponent(keyword)}`);
            return res?.data || res || [];
        },
        enabled: !!keyword,
        staleTime: 5 * 60 * 1000,
    });
}
