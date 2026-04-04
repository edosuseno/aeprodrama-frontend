import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export interface Dramabox2Drama {
  id: string;
  title: string;
  cover: string;
  description: string;
  chapterCount: number;
  provider: string;
}

export interface Dramabox2Episode {
  id: string;
  index: number;
  title: string;
  videoAddress: string;
  subtitle: string;
}

export interface Dramabox2Detail {
  id: string;
  title: string;
  cover: string;
  description: string;
  episodes: Dramabox2Episode[];
  totalEpisodes: number;
  provider: string;
}

export function useDramabox2Explore(page = 1) {
    return useQuery({
        queryKey: ["dramabox2", "explore", page],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/dramabox2/explore?page=${page}`);
            const items = data?.data || data;
            return (Array.isArray(items) ? items : []) as Dramabox2Drama[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useInfiniteDramabox2() {
    return useInfiniteQuery({
        queryKey: ["dramabox2", "infinite"],
        queryFn: async ({ pageParam = 1 }) => {
            const data = await fetchJson<any>(`/api/dramabox2/explore?page=${pageParam}`);
            const items = data?.data || data;
            return (Array.isArray(items) ? items : []) as Dramabox2Drama[];
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < 5) return undefined;
            return allPages.length + 1;
        },
        staleTime: 1000 * 60 * 5,
    });
}

export function useDramabox2Detail(id: string) {
    return useQuery({
        queryKey: ["dramabox2", "detail", id],
        queryFn: async () => {
            try {
                const res = await fetchJson<any>(`/api/dramabox2/detail?id=${id}`);
                if (!res) return null;
                // Sangat penting: jangan biarkan return undefined
                const detailData = res.data || res;
                return detailData as Dramabox2Detail || null;
            } catch (err) {
                console.error("Error in useDramabox2Detail:", err);
                return null;
            }
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
}

export function useDramabox2Watch(id: string, episodeId: string | number) {
    return useQuery({
        queryKey: ["dramabox2", "watch", id, episodeId],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/dramabox2/watch?id=${id}&episodeIndex=${episodeId}`);
            if (!data) return null;
            if (typeof data === "string") return data;
            if (data?.url) return data.url as string;
            if (data?.data) return data.data as string;
            return data as unknown as string || null;
        },
        enabled: !!id && !!episodeId,
        staleTime: 2 * 60 * 1000,
    });
}
