import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

const platform = "goodshort";

export function useGoodShortExplore(page: number = 1) {
    return useQuery({
        queryKey: [platform, "explore", page],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/${platform}/explore?page=${page}`);
            const items = data?.data || data;
            return (Array.isArray(items) ? items : []) as any[];
        },
    });
}

export function useInfiniteGoodShort() {
    return useInfiniteQuery({
        queryKey: [platform, "infinite"],
        queryFn: async ({ pageParam = 1 }) => {
            const data = await fetchJson<any>(`/api/${platform}/explore?page=${pageParam}`);
            const items = data?.data || data;
            return (Array.isArray(items) ? items : []) as any[];
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
        queryKey: [platform, "search", keyword],
        queryFn: async () => {
            const data = await fetchJson<any>(`/api/${platform}/search?keyword=${keyword}`);
            const items = data?.data || data;
            return (Array.isArray(items) ? items : []) as any[];
        },
        enabled: !!keyword,
    });
}

export function useGoodShortDetail(id: string) {
    return useQuery({
        queryKey: [platform, "detail", id],
        queryFn: async () => {
            try {
                const res = await fetchJson<any>(`/api/${platform}/detail?id=${id}`);
                if (!res) return null;
                // Unwrap data jika ada (setelah decrypt, data mungkin di-wrap dalam .data)
                return (res.data || res) as any;
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
        queryKey: [platform, "watch", id, episodeIndex],
        queryFn: async () => {
            try {
                const res = await fetchJson<any>(`/api/${platform}/watch?id=${id}&episodeIndex=${episodeIndex}`);
                if (!res) return null;
                // Backend mengembalikan { url, subtitle } setelah decrypt
                // Bisa juga string langsung (fallback)
                return (typeof res === "string" ? res : (res.data || res)) as string | { url: string; subtitle?: string };
            } catch (err) {
                console.error("[GoodShort] Watch error:", err);
                return null;
            }
        },
        enabled: !!id && episodeIndex !== undefined,
        staleTime: 2 * 60 * 1000,
    });
}

