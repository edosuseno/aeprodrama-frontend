"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export interface Shortwave2Episode {
  id: string;
  episodeNo: number;
  episodeNumber: number;
  name?: string;
  title?: string;
  _h264?: string;
  _h265?: string;
  videoUrl?: string;
  [key: string]: any;
}

export interface Shortwave2DetailResponse {
  id: string;
  title: string;
  poster: string;
  description: string;
  episodes: Shortwave2Episode[];
  [key: string]: any;
}

export function useShortwave2Explore(page = 1, categoryId?: string | number) {
    return useQuery<any[]>({
        queryKey: ["shortwave2", "explore", page, categoryId],
        queryFn: () => fetchJson<any[]>(`/api/shortwave2/explore?page=${page}${categoryId ? `&categoryId=${categoryId}` : ''}`),
        staleTime: 5 * 60 * 1000,
    });
}

export function useInfiniteShortwave2(categoryId?: string | number, allCategories?: any[]) {
  return useInfiniteQuery({
    queryKey: ["shortwave2", "infinite", categoryId, allCategories?.length],
    queryFn: async ({ pageParam = { catIdx: -1, page: 1 } }: { pageParam: { catIdx: number; page: number } }) => {
      let currentCatId = categoryId;
      let targetPage = pageParam.page;
      let currentCatIdx = pageParam.catIdx;

      if (categoryId === undefined && allCategories && allCategories.length > 0) {
        if (currentCatIdx === -1) {
          currentCatId = undefined;
        } else {
          const activeCat = allCategories.filter(c => c.category_id !== 0 && c.display_name !== "SEMUA")[currentCatIdx];
          currentCatId = activeCat?.category_id;
        }
      }

      const data = await fetchJson<any[]>(
        `/api/shortwave2/explore?page=${targetPage}${currentCatId ? `&categoryId=${currentCatId}` : ''}`
      );
      return {
        items: data || [],
        currentCatIdx,
        page: targetPage
      };
    },
    initialPageParam: { catIdx: -1, page: 1 },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) return undefined;

      if (lastPage.items.length >= 10) {
        return { catIdx: lastPage.currentCatIdx, page: lastPage.page + 1 };
      }

      if (categoryId === undefined && allCategories && allCategories.length > 0) {
        const nextCatIdx = lastPage.currentCatIdx + 1;
        const availableCats = allCategories.filter(c => c.category_id !== 0 && c.display_name !== "SEMUA");
        
        if (nextCatIdx < availableCats.length) {
          return { catIdx: nextCatIdx, page: 1 };
        }
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useShortwave2Detail(shortPlayId: string) {
    return useQuery<Shortwave2DetailResponse>({
        queryKey: ["shortwave2", "detail", shortPlayId],
        queryFn: () => fetchJson<Shortwave2DetailResponse>(`/api/shortwave2/detail?shortPlayId=${shortPlayId}`),
        enabled: !!shortPlayId,
        staleTime: 5 * 60 * 1000,
    });
}
