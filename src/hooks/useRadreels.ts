import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export interface RadreelsDrama {
  id: string;
  title: string;
  cover: string;
  description: string;
  totalEpisodes?: number;
  provider: string;
}

export interface RadreelsDetail extends RadreelsDrama {
  episodes: {
    id: string;
    index: number;
    title: string;
    subtitle?: string;
    videoAddress?: string;
  }[];
  totalEpisodes: number;
  chapterCount?: number;
}

export function useRadreelsExplore(page = 1) {
  return useQuery<RadreelsDrama[]>({
    queryKey: ["radreels", "explore", page],
    queryFn: async () => {
      const data = await fetchJson<any>(`/api/radreels/home?page=${page}`);
      if (Array.isArray(data)) return data as RadreelsDrama[];
      if (data?.data && Array.isArray(data.data)) return data.data as RadreelsDrama[];
      return [] as RadreelsDrama[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInfiniteRadreels() {
  return useInfiniteQuery({
    queryKey: ["radreels", "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await fetchJson<any>(`/api/radreels/home?page=${pageParam}`);
      if (Array.isArray(data)) return data as RadreelsDrama[];
      if (data?.data && Array.isArray(data.data)) return data.data as RadreelsDrama[];
      return [] as RadreelsDrama[];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 5) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useRadreelsDetail(id: string) {
  return useQuery<RadreelsDetail>({
    queryKey: ["radreels", "detail", id],
    queryFn: async () => {
      const res = await fetchJson<any>(`/api/radreels/detail?id=${id}`);
      return res.data || res;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRadreelsStream(id: string, episodeIndex: number | string) {
  return useQuery<any>({
    queryKey: ["radreels", "stream", id, episodeIndex],
    queryFn: async () => {
      const res = await fetchJson<any>(`/api/radreels/watch?id=${id}&episodeIndex=${episodeIndex}`);
      return res.data || res;
    },
    enabled: !!id && !!episodeIndex,
    staleTime: 5 * 60 * 1000,
  });
}
