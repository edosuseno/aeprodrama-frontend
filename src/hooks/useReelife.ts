import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchJson } from "@/lib/fetcher";

export interface ReelifeDrama {
    id: string;
    title: string;
    cover: string;
    description?: string;
    provider: string;
    source: string;
}

export interface ReelifeEpisode {
    id: string;
    chapterId: string;
    index: number;
    chapterIndex: number;
    episodeNumber: number;
    title: string;
    isFree: boolean;
}

export interface ReelifeDetail extends ReelifeDrama {
    totalEpisodes: number;
    episodes: ReelifeEpisode[];
}

export function useReelifeExplore(page: number = 1) {
    return useQuery({
        queryKey: ['reelife_explore', page],
        queryFn: async () => {
            const res = await fetchJson<any>(`/api/reelife/explore?page=${page}`);
            return (res.data || res) as ReelifeDrama[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useInfiniteReelife() {
    return useInfiniteQuery({
        queryKey: ['reelife_infinite'],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await fetchJson<any>(`/api/reelife/explore?page=${pageParam}`);
            return (res.data || res) as ReelifeDrama[];
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length > 0 ? allPages.length + 1 : undefined;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useReelifeSearch(keyword: string) {
    return useQuery({
        queryKey: ['reelife_search', keyword],
        queryFn: async () => {
            if (!keyword) return [];
            const res = await fetchJson<any>(`/api/reelife/search?keyword=${encodeURIComponent(keyword)}`);
            return (res.data || res) as ReelifeDrama[];
        },
        enabled: !!keyword,
        staleTime: 5 * 60 * 1000,
    });
}

export function useReelifeDetail(id: string) {
    return useQuery({
        queryKey: ['reelife_detail', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await fetchJson<any>(`/api/reelife/detail?id=${id}`);
            return (res.data || res) as ReelifeDetail;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useReelifeStream(bookId: string, episodeIndex: string | number) {
    return useQuery({
        queryKey: ['reelife_watch', bookId, episodeIndex],
        queryFn: async () => {
            if (!bookId || !episodeIndex) return null;
            const res = await fetchJson<any>(`/api/reelife/watch?id=${bookId}&episodeIndex=${episodeIndex}`);
            return (res.data || res) as { url: string; subtitle?: string; provider?: string };
        },
        enabled: !!bookId && !!episodeIndex,
        staleTime: 5 * 60 * 1000, // cache stream lama agar tidak sering fetch
        retry: 1
    });
}
