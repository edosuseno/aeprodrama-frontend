import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchJson } from "@/lib/fetcher";

export interface FlexTVDrama {
    id: string;
    title: string;
    cover: string;
    description?: string;
    provider: string;
    source: string;
}

export interface FlexTVEpisode {
    id: string;
    chapterId: string;
    index: number;
    chapterIndex: number;
    episodeNumber: number;
    title: string;
    isFree: boolean;
    subtitle?: string;
    videoAddress?: string;
}

export interface FlexTVDetail extends FlexTVDrama {
    totalEpisodes: number;
    episodes: FlexTVEpisode[];
    chapterCount?: number;
}

export function useFlexTVExplore(page: number = 1) {
    return useQuery({
        queryKey: ['flextv_explore', page],
        queryFn: async () => {
            const res = await fetchJson<any>(`/api/flextv/explore?page=${page}`);
            return (res.data || res) as FlexTVDrama[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useInfiniteFlexTV() {
    return useInfiniteQuery({
        queryKey: ['flextv_infinite'],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await fetchJson<any>(`/api/flextv/explore?page=${pageParam}`);
            return (res.data || res) as FlexTVDrama[];
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length > 0 ? allPages.length + 1 : undefined;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useFlexTVSearch(keyword: string) {
    return useQuery({
        queryKey: ['flextv_search', keyword],
        queryFn: async () => {
            if (!keyword) return [];
            const res = await fetchJson<any>(`/api/flextv/search?keyword=${encodeURIComponent(keyword)}`);
            return (res.data || res) as FlexTVDrama[];
        },
        enabled: !!keyword,
        staleTime: 5 * 60 * 1000,
    });
}

export function useFlexTVDetail(id: string) {
    return useQuery({
        queryKey: ['flextv_detail', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await fetchJson<any>(`/api/flextv/detail?id=${id}`);
            return (res.data || res) as FlexTVDetail;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useFlexTVStream(bookId: string, episodeIndex: string | number) {
    return useQuery({
        queryKey: ['flextv_watch', bookId, episodeIndex],
        queryFn: async () => {
            if (!bookId || !episodeIndex) return null;
            const res = await fetchJson<any>(`/api/flextv/watch?id=${bookId}&episodeIndex=${episodeIndex}`);
            return (res.data || res) as { url: string; subtitle?: string; provider?: string };
        },
        enabled: !!bookId && !!episodeIndex,
        staleTime: 5 * 60 * 1000, // cache stream lama agar tidak sering fetch
        retry: 1
    });
}
