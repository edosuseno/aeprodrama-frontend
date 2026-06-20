"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export interface ViglooDrama {
  id: string | number;
  title: string;
  cover: string;
  description?: string;
  episodeCount?: number;
  [key: string]: any;
}

export interface ViglooEpisode {
  id: string | number;
  episodeNo: number;
  title: string;
  cover?: string;
  [key: string]: any;
}

export interface ViglooDetailResponse {
  id: string | number;
  title: string;
  cover: string;
  description: string;
  seasonId: string | number;
  episodeCount: number;
  episodes: ViglooEpisode[];
  [key: string]: any;
}

export function useViglooExplore() {
    return useInfiniteQuery({
        queryKey: ["vigloo", "explore"],
        queryFn: async ({ pageParam = 1 }) => {
            const data = await fetchJson(`/api/vigloo/explore?page=${pageParam}`);
            const items = data?.data?.dramas || data?.dramas || data || [];
            return {
                items,
                nextPage: items.length > 0 ? pageParam + 1 : undefined,
            };
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });
}

export function useViglooDetail(id: string) {
    return useQuery<ViglooDetailResponse>({
        queryKey: ["vigloo", "detail", id],
        queryFn: async (): Promise<ViglooDetailResponse> => {
            const data = await fetchJson(`/api/vigloo/detail?id=${id}`);
            return data as ViglooDetailResponse;
        },
        enabled: !!id,
    });
}

export function useViglooEpisode(id: string, seasonId: string, ep: number) {
    return useQuery<any>({
        queryKey: ["vigloo", "stream", id, seasonId, ep],
        queryFn: async (): Promise<any> => {
            const data = await fetchJson(`/api/vigloo/stream?id=${id}&seasonId=${seasonId}&ep=${ep}`);
            return data;
        },
        enabled: !!id && !!seasonId && !!ep,
        retry: 1
    });
}

export function useViglooSearch(query: string) {
    return useInfiniteQuery({
        queryKey: ["vigloo", "search", query],
        queryFn: async ({ pageParam = 1 }) => {
            if (!query) return { items: [], nextPage: undefined };
            const data = await fetchJson(`/api/vigloo/search?query=${encodeURIComponent(query)}&page=${pageParam}`);
            const items = data?.data?.items || data?.items || data || [];
            return {
                items,
                nextPage: items.length > 0 ? pageParam + 1 : undefined,
            };
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: !!query,
    });
}
