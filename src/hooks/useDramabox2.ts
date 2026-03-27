"use client";

import { useQuery } from "@tanstack/react-query";
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
            // If data is decrypted array directly
            if (Array.isArray(data)) return data as Dramabox2Drama[];
            // If it's an object { success, data }
            if (data?.data && Array.isArray(data.data)) return data.data as Dramabox2Drama[];
            return [] as Dramabox2Drama[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useDramabox2Detail(id: string) {
    return useQuery({
        queryKey: ["dramabox2", "detail", id],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/dramabox2/detail?id=${id}`);
            if (data?.id) return data as Dramabox2Detail;
            if (data?.data) return data.data as Dramabox2Detail;
            return data as Dramabox2Detail;
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
}

export function useDramabox2Watch(id: string, episodeIndex: number) {
    return useQuery({
        queryKey: ["dramabox2", "watch", id, episodeIndex],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/dramabox2/watch?id=${id}&episodeIndex=${episodeIndex}`);
            if (typeof data === "string") return data;
            if (data?.data) return data.data as string;
            return data as string;
        },
        enabled: !!id && !!episodeIndex,
        staleTime: 2 * 60 * 1000,
    });
}
