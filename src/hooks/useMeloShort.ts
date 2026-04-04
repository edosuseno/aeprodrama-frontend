import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

const platform = "meloshort";

export interface MeloShortDrama {
  id: string;
  title: string;
  cover: string;
  description: string;
  chapterCount: number;
  provider: string;
}

export interface MeloShortEpisode {
  id: string;
  index: number;
  title: string;
  videoAddress: string;
  subtitle?: string;
}

export interface MeloShortDetail {
  id: string;
  title: string;
  cover: string;
  description: string;
  episodes: MeloShortEpisode[];
  totalEpisodes: number;
  provider: string;
}

export function useMeloShortExplore(page: number = 1) {
    return useQuery({
        queryKey: [platform, "explore", page],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/${platform}/explore?page=${page}`);
            const items = data?.data || data;
            return (Array.isArray(items) ? items : []) as MeloShortDrama[];
        },
    });
}

export function useInfiniteMeloShort() {
    return useInfiniteQuery({
        queryKey: [platform, "infinite"],
        queryFn: async ({ pageParam = 1 }) => {
            const data = await fetchJson<any>(`/api/${platform}/explore?page=${pageParam}`);
            const items = data?.data || data;
            return (Array.isArray(items) ? items : []) as MeloShortDrama[];
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < 5) return undefined;
            return allPages.length + 1;
        },
        staleTime: 1000 * 60 * 5,
    });
}

export function useMeloShortDetail(id: string) {
    return useQuery({
        queryKey: [platform, "detail", id],
        queryFn: async () => {
          const res = await fetchJson<any>(`/api/${platform}/detail?id=${id}`);
          if (!res) return null;
          return (res.data || res) as MeloShortDetail;
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
}

export function useMeloShortWatch(id: string, chapterId: string) {
    return useQuery({
        queryKey: [platform, "watch", id, chapterId],
        queryFn: async () => {
            const res = await fetchJson<any>(`/api/${platform}/watch?id=${id}&chapterId=${chapterId}`);
            if (!res) return null;
            return (typeof res === "string" ? res : (res.data || res)) as string | { url: string; subtitle?: string };
        },
        enabled: !!id && !!chapterId,
        staleTime: 2 * 60 * 1000,
    });
}
