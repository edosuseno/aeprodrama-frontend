
"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

export interface StardustTVDrama {
  id: string;
  shortPlayId: string;
  title: string;
  name: string;
  poster: string;
  intro?: string;
  description?: string;
  badge?: string;
  [key: string]: any;
}

export interface StardustTVCategory {
  category_id: number;
  display_name: string;
}

export interface StardustTVEpisode {
  id: string;
  episodeNo: number;
  episodeNumber: number;
  name: string;
  title: string;
  _h264?: string;
  _h265?: string;
  videoUrl?: string;
  [key: string]: any;
}

export interface StardustTVDetailResponse {
  id: string;
  title: string;
  poster: string;
  description: string;
  episodes: StardustTVEpisode[];
  [key: string]: any;
}

export function useStardustTVCategories() {
    return useQuery<StardustTVCategory[]>({
        queryKey: ["stardusttv", "categories"],
        queryFn: () => fetchJson<StardustTVCategory[]>("/api/stardusttv/categories"),
        staleTime: 60 * 60 * 1000,
    });
}

export function useStardustTVExplore(page = 1, categoryId?: string | number) {
    return useQuery<StardustTVDrama[]>({
        queryKey: ["stardusttv", "explore", page, categoryId],
        queryFn: () => fetchJson<StardustTVDrama[]>(`/api/stardusttv/explore?page=${page}${categoryId ? `&categoryId=${categoryId}` : ''}`),
        staleTime: 5 * 60 * 1000,
    });
}

export function useStardustTVDetail(shortPlayId: string) {
    return useQuery<StardustTVDetailResponse>({
        queryKey: ["stardusttv", "detail", shortPlayId],
        queryFn: () => fetchJson<StardustTVDetailResponse>(`/api/stardusttv/detail?shortPlayId=${shortPlayId}`),
        enabled: !!shortPlayId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useStardustTVSearch(query: string) {
    return useQuery<StardustTVDrama[]>({
        queryKey: ["stardusttv", "search", query],
        queryFn: () => fetchJson<StardustTVDrama[]>(`/api/stardusttv/search?query=${encodeURIComponent(query)}`),
        enabled: !!query,
        staleTime: 60 * 1000,
    });
}

export function useInfiniteStardustTV(categoryId?: string | number, allCategories?: StardustTVCategory[]) {
  return useInfiniteQuery({
    queryKey: ["stardusttv", "infinite", categoryId, allCategories?.length],
    queryFn: async ({ pageParam = { catIdx: -1, page: 1 } }: { pageParam: { catIdx: number; page: number } }) => {
      let currentCatId = categoryId;
      let targetPage = pageParam.page;
      let currentCatIdx = pageParam.catIdx;

      // Jika categoryId tidak ada (Semua), gunakan logika chaining
      if (categoryId === undefined && allCategories && allCategories.length > 0) {
        if (currentCatIdx === -1) {
          // Mulai dari 'combined'
          currentCatId = undefined;
        } else {
          // Gunakan kategori dari list
          const activeCat = allCategories.filter(c => c.category_id !== 0 && c.display_name !== "SEMUA")[currentCatIdx];
          currentCatId = activeCat?.category_id;
        }
      }

      const data = await fetchJson<StardustTVDrama[]>(
        `/api/stardusttv/explore?page=${targetPage}${currentCatId ? `&categoryId=${currentCatId}` : ''}`
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

      // Jika item masih banyak (>= 10), lanjut halaman berikutnya di kategori yang sama
      if (lastPage.items.length >= 10) {
        return { catIdx: lastPage.currentCatIdx, page: lastPage.page + 1 };
      }

      // Jika item sedikit (< 10) dan kita di mode 'Semua', coba pindah ke kategori berikutnya
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
