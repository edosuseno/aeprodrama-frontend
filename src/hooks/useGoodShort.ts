import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export function useGoodShortExplore(page: number = 1) {
    return useQuery({
        queryKey: ["goodshort", "explore", page],
        queryFn: async () => {
            try {
                const data = await fetchJson<any>(`/api/goodshort/explore?page=${page}`);
                const items = data?.data || data;
                return (Array.isArray(items) ? items : []);
            } catch (err) {
                console.error("[GoodShort] Explore error:", err);
                return [];
            }
        },
    });
}

export function useInfiniteGoodShort() {
    return useInfiniteQuery({
        queryKey: ["goodshort", "infinite"],
        queryFn: async ({ pageParam = 1 }) => {
            try {
                const data = await fetchJson<any>(`/api/goodshort/explore?page=${pageParam}`);
                const items = data?.data || data;
                return (Array.isArray(items) ? items : []);
            } catch (err) {
                console.error("[GoodShort] Infinite error:", err);
                return [];
            }
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < 5) return undefined;
            return allPages.length + 1;
        },
        staleTime: 1000 * 60 * 5,
    });
}

export function useGoodShortSearch(keyword: string) {
    return useQuery({
        queryKey: ["goodshort", "search", keyword],
        queryFn: async () => {
            try {
                const data = await fetchJson<any>(`/api/goodshort/search?keyword=${encodeURIComponent(keyword)}`);
                const items = data?.data || data;
                return (Array.isArray(items) ? items : []);
            } catch (err) {
                console.error("[GoodShort] Search error:", err);
                return [];
            }
        },
        enabled: !!keyword,
    });
}

export function useGoodShortDetail(id: string) {
    return useQuery({
        queryKey: ["goodshort", "detail", id],
        queryFn: async () => {
            try {
                const data = await fetchJson<any>(`/api/goodshort/detail?bookId=${id}`);
                return (data?.data || data) || null;
            } catch (err) {
                console.error("[GoodShort] Detail error:", err);
                return null;
            }
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
}

export function useGoodShortWatch(id: string, episodeIndex: number) {
    return useQuery({
        queryKey: ["goodshort", "watch", id, episodeIndex],
        queryFn: async () => {
            try {
                const data = await fetchJson<any>(`/api/goodshort/watch?bookId=${id}&episodeIndex=${episodeIndex}`);
                return (data?.data || data) || null;
            } catch (err) {
                console.error("[GoodShort] Watch error:", err);
                return null;
            }
        },
        enabled: !!id && episodeIndex !== undefined,
        staleTime: 2 * 60 * 1000,
    });
}
