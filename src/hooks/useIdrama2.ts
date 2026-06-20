import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export interface Idrama2Drama {
  id: string;
  title: string;
  cover: string;
  book_id?: string;
  book_title?: string;
  book_pic?: string;
  provider: string;
  source: string;
}

export interface Idrama2Episode {
  id: string | number;
  chapterId: string | number;
  title: string;
  index: number;
  episodeNumber: number;
  isFree: boolean;
  duration?: number;
}

export interface Idrama2DetailResponse {
  id: string;
  title: string;
  description: string;
  synopsis: string;
  cover: string;
  totalEpisodes: number;
  episodes: Idrama2Episode[];
  provider: string;
  source: string;
}

export function useIdrama2Explore(page = 1) {
    return useQuery<Idrama2Drama[]>({
        queryKey: ["idrama2", "explore", page],
        queryFn: () => fetchJson<Idrama2Drama[]>(`/api/idrama2/explore?page=${page}`),
    });
}

export function useIdrama2Detail(id: string) {
    return useQuery<Idrama2DetailResponse>({
        queryKey: ["idrama2", "detail", id],
        queryFn: () => fetchJson<Idrama2DetailResponse>(`/api/idrama2/detail/${id}`),
    });
}

export function useIdrama2Search(query: string) {
    return useQuery<Idrama2Drama[]>({
        queryKey: ["idrama2", "search", query],
        queryFn: () => fetchJson<Idrama2Drama[]>(`/api/idrama2/search?q=${encodeURIComponent(query)}`),
        enabled: !!query,
    });
}

export function useInfiniteIdrama2() {
  return useInfiniteQuery<Idrama2Drama[]>({
    queryKey: ["idrama2", "infinite"],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const targetPage = pageParam as number;
      const data = await fetchJson<Idrama2Drama[]>(`/api/idrama2/explore?page=${targetPage}`);
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return allPages.length + 1;
    },
  });
}
