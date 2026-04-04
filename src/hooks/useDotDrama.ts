import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export interface DotDramaDrama {
  id: string;
  title: string;
  cover: string;
  description: string;
  chapterCount: number;
  provider: string;
}

export interface DotDramaEpisode {
  id: string;
  index: number;
  title: string;
  videoAddress: string;
  subtitle: string;
}

export interface DotDramaDetail {
  id: string;
  title: string;
  cover: string;
  description: string;
  episodes: DotDramaEpisode[];
  totalEpisodes: number;
  provider: string;
}

export function useDotDramaExplore(page = 1) {
    return useQuery({
        queryKey: ["dotdrama", "explore", page],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/dotdrama/explore?page=${page}`);
            const items = data?.data || data;
            return (Array.isArray(items) ? items : []) as DotDramaDrama[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useInfiniteDotDrama() {
    return useInfiniteQuery({
        queryKey: ["dotdrama", "infinite"],
        queryFn: async ({ pageParam = 1 }) => {
            const data = await fetchJson<any>(`/api/dotdrama/explore?page=${pageParam}`);
            const items = data?.data || data;
            return (Array.isArray(items) ? items : []) as DotDramaDrama[];
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < 5) return undefined;
            return allPages.length + 1;
        },
        staleTime: 1000 * 60 * 5,
    });
}

export function useDotDramaDetail(id: string) {
    return useQuery({
        queryKey: ["dotdrama", "detail", id],
        queryFn: async () => {
            try {
                const res = await fetchJson<any>(`/api/dotdrama/detail?id=${id}`);
                if (!res) return null;
                return (res.data || res) as DotDramaDetail;
            } catch (err) {
                console.error("DotDramaDetail error:", err);
                return null;
            }
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
}

export function useDotDramaWatch(id: string, episodeIndex: number) {
    return useQuery({
        queryKey: ["dotdrama", "watch", id, episodeIndex],
        queryFn: async () => {
            try {
                const res = await fetchJson<any>(`/api/dotdrama/watch?id=${id}&episodeIndex=${episodeIndex}`);
                if (!res) return null;
                return (typeof res === "string" ? res : (res.data || res)) as string;
            } catch (err) {
                return null;
            }
        },
        enabled: !!id && !!episodeIndex,
        staleTime: 2 * 60 * 1000,
    });
}
