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
        queryFn: () => fetchJson<any[]>(`/api/${platform}/search?keyword=${keyword}`),
        enabled: !!keyword,
    });
}

export function useGoodShortDetail(id: string) {
    return useQuery({
        queryKey: [platform, "detail", id],
        queryFn: () => fetchJson<any>(`/api/${platform}/detail?id=${id}`),
        enabled: !!id,
    });
}

export function useGoodShortWatch(id: string, episodeIndex: number) {
    return useQuery({
        queryKey: [platform, "watch", id, episodeIndex],
        queryFn: () => fetchJson<string>(`/api/${platform}/watch?id=${id}&episodeIndex=${episodeIndex}`),
        enabled: !!id && episodeIndex !== undefined,
    });
}
