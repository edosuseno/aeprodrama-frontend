
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export interface VeloloDrama {
  id: string;
  title: string;
  cover: string;
  description: string;
  chapterCount?: number;
  provider: string;
}

export interface VeloloDetail extends VeloloDrama {
  episodes: {
    id: string;
    index: number;
    title: string;
    subtitle?: string;
  }[];
  totalEpisodes: number;
}

export function useVeloloExplore(page = 1) {
  return useQuery<VeloloDrama[]>({
    queryKey: ["velolo", "explore", page],
    queryFn: () => fetchJson<VeloloDrama[]>(`/api/velolo/explore?page=${page}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInfiniteVelolo() {
  return useInfiniteQuery({
    queryKey: ["velolo", "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      fetchJson<VeloloDrama[]>(`/api/velolo/explore?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 5) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useVeloloDetail(id: string) {
  return useQuery<VeloloDetail>({
    queryKey: ["velolo", "detail", id],
    queryFn: () => fetchJson<VeloloDetail>(`/api/velolo/detail?id=${id}`),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useVeloloStream(id: string, episodeIndex: number) {
  return useQuery<string>({
    queryKey: ["velolo", "stream", id, episodeIndex],
    queryFn: () => fetchJson<string>(`/api/velolo/watch?id=${id}&episodeIndex=${episodeIndex}`),
    enabled: !!id && !!episodeIndex,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVeloloSearch(query: string) {
  return useQuery<VeloloDrama[]>({
    queryKey: ["velolo", "search", query],
    queryFn: () => fetchJson<VeloloDrama[]>(`/api/velolo/search?query=${encodeURIComponent(query)}`),
    enabled: !!query,
    staleTime: 2 * 60 * 1000,
  });
}
