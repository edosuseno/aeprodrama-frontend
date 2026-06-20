"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

interface NetShortDrama {
  shortPlayId: string;
  shortPlayLibraryId: string;
  title: string;
  cover: string;
  labels: string[];
  heatScore: string;
  scriptName?: string;
  totalEpisodes?: number;
}

interface NetShortGroup {
  groupId: string;
  groupName: string;
  contentRemark: string;
  dramas: NetShortDrama[];
}

interface TheatersResponse {
  success: boolean;
  data: NetShortGroup[];
}

interface ForYouResponse {
  success: boolean;
  data: NetShortDrama[];
  maxOffset?: number;
  completed?: boolean;
}

interface SearchResponse {
  success: boolean;
  data: NetShortDrama[];
}

interface NetShortEpisode {
  episodeId: string;
  episodeNo: number;
  cover: string;
  videoUrl: string;
  quality: string;
  isLock: boolean;
  likeNums: string;
  subtitleUrl?: string;
}

interface DetailResponse {
  success: boolean;
  shortPlayId: string;
  shortPlayLibraryId: string;
  title: string;
  cover: string;
  description: string;
  labels: string[];
  totalEpisodes: number;
  isFinish: boolean;
  payPoint: number;
  episodes: NetShortEpisode[];
}

import { fetchJson } from "@/lib/fetcher";
import { decryptData } from "@/lib/crypto";

// ... existing interfaces

export function useNetShortTheaters() {
  return useQuery<TheatersResponse>({
    queryKey: ["netshort", "theaters"],
    queryFn: () => fetchJson<TheatersResponse>("/api/netshort/theaters"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useNetShortForYou(page = 1) {
  return useQuery<ForYouResponse>({
    queryKey: ["netshort", "foryou", page],
    queryFn: () => fetchJson<ForYouResponse>(`/api/netshort/foryou?page=${page}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useNetShortSearch(query: string) {
  return useQuery<SearchResponse>({
    queryKey: ["netshort", "search", query],
    queryFn: () => fetchJson<SearchResponse>(`/api/netshort/search?query=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export async function fetchNetShortDetail(shortPlayId: string): Promise<DetailResponse> {
  const data = await fetchJson<DetailResponse>(`/api/netshort/detail?shortPlayId=${shortPlayId}`);
  // Validasi: jika response 200 tapi data kosong (tidak ada title/episodes), throw error agar React Query retry
  if (!data?.title && !data?.episodes) {
    throw new Error("Detail data kosong, kemungkinan API belum siap");
  }
  return data;
}

export function useNetShortDetail(shortPlayId: string) {
  return useQuery<DetailResponse>({
    queryKey: ["netshort", "detail", shortPlayId],
    queryFn: () => fetchNetShortDetail(shortPlayId),
    enabled: !!shortPlayId,
    staleTime: 5 * 60 * 1000,
    retry: 2, // Retry 2x jika gagal (Sansekai sering lambat di request pertama)
    retryDelay: 1000, // Tunggu 1 detik sebelum retry
  });
}

export function useInfiniteNetShort() {
  return useInfiniteQuery({
    queryKey: ["netshort", "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/netshort/explore?page=${pageParam}`);
      const json = await res.json();
      let data = json;

      if (json.data && typeof json.data === "string") {
        data = decryptData(json.data);
      }

      // Netshort structure: { data: [ dramas ], maxOffset, completed }
      const items = data.data || (Array.isArray(data) ? data : []);
      return items as NetShortDrama[];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 5) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useNetShortWatch(shortPlayId: string, episodeIndex: number) {
  return useQuery({
    queryKey: ["netshort", "watch", shortPlayId, episodeIndex],
    queryFn: async () => {
      const res = await fetch(`/api/netshort/watch?shortPlayId=${shortPlayId}&episodeIndex=${episodeIndex}`);
      const json = await res.json();
      if (json.success && json.data) {
        if (typeof json.data === 'string') {
          return decryptData(json.data);
        }
        return json.data;
      }
      throw new Error("Failed to load Netshort stream");
    },
    enabled: !!shortPlayId && episodeIndex > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export type { NetShortDrama, NetShortGroup, NetShortEpisode, DetailResponse };
