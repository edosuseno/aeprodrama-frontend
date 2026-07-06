import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

const platform = "pine";

export interface PineDrama {
  id: string;
  title: string;
  cover: string;
  description: string;
  categories?: string;
  totalEpisodes: number;
  viewCount?: number;
}

export interface PineEpisode {
  id?: string;
  index: number;
  title?: string;
  videoUrl?: string; // We'll map this from whatever the API uses (videoAddress, etc)
  videoAddress?: string;
  subtitle?: string;
}

export interface PineDetail {
  id: string;
  collectionId?: string;
  title: string;
  cover: string;
  description: string;
  categories?: string;
  totalEpisodes: number;
  viewCount?: number;
}

export function usePineExplore(page: number = 1) {
    return useQuery({
        queryKey: [platform, "explore", page],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/${platform}/explore?page=${page}`);
            const items = data?.data || data;
            return (Array.isArray(items) ? items : []) as PineDrama[];
        },
    });
}

export function useInfinitePine() {
    return useInfiniteQuery({
        queryKey: [platform, "infinite"],
        queryFn: async ({ pageParam = 1 }) => {
            const data = await fetchJson<any>(`/api/${platform}/explore?page=${pageParam}`);
            const items = data?.data || data;
            return (Array.isArray(items) ? items : []) as PineDrama[];
        },
        getNextPageParam: (lastPage, allPages) => {
            // Since we pull 500 at once, we might not need pagination, but if we do, just increment
            // If the API stops returning items, we stop.
            if (!lastPage || lastPage.length === 0) return undefined;
            return allPages.length + 1;
        },
        initialPageParam: 1,
    });
}

export function usePineDetail(id: string) {
    return useQuery({
        queryKey: [platform, "detail", id],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/${platform}/detail?id=${id}`);
            return data?.data as PineDetail;
        },
        enabled: !!id,
    });
}

export function usePineEpisodes(id: string) {
    return useQuery({
        queryKey: [platform, "episodes", id],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/${platform}/watch?id=${id}`);
            // The API returns { collectionId, totalEpisodes, episodes: [...] }
            const episodesList = data?.data?.episodes || [];
            return episodesList as PineEpisode[];
        },
        enabled: !!id,
    });
}

export function usePinePlay(id: string, ep: number) {
    return useQuery({
        queryKey: [platform, "play", id, ep],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/${platform}/play?id=${id}&ep=${ep}`);
            return data?.data; // Returns { playUrl, subtitles, ... }
        },
        enabled: !!id && !!ep,
    });
}

