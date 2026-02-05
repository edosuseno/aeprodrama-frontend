
"use client";

import { useQuery, keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

// Interfaces based on Melolo JSON response
export interface MeloloBook {
  book_id: string;
  book_name: string;
  thumb_url: string;
  abstract?: string;
  author?: string;
  book_status?: string; // "1" ?
  category_info?: string; // JSON string
  stat_infos?: string[];
  serial_count?: number;
  [key: string]: any;
}

export interface MeloloResponse {
  algo: number;
  books: MeloloBook[];
  has_more?: boolean;
  next_offset?: number;
}

export interface MeloloSearchResponse {
  code: number;
  data: {
    search_data: {
      books: MeloloBook[];
    }[];
  };
}

export interface MeloloVideo {
  vid: string;
  vid_index: number;
  title: string;
  cover: string;
  episode_cover: string;
  duration: number;
  digged_count: number;
  comment_count: number;
  [key: string]: any;
}

export interface MeloloDetailResponse {
  code: number;
  data: {
    video_data: {
      series_id_str: string;
      series_title: string;
      series_cover: string;
      series_intro: string;
      episode_cnt: number;
      video_list: MeloloVideo[];
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export interface MeloloStreamResponse {
  code: number;
  data: {
    main_url: string;
    video_model: string; // JSON string containing more details if needed
    [key: string]: any;
  };
}

export function useMeloloLatest() {
  return useQuery<MeloloResponse>({
    queryKey: ["melolo", "latest"],
    queryFn: () => fetchJson<MeloloResponse>("/api/melolo/latest"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMeloloTrending() {
  return useQuery<MeloloResponse>({
    queryKey: ["melolo", "trending"],
    queryFn: () => fetchJson<MeloloResponse>("/api/melolo/trending"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMeloloSearch(query: string) {
  return useQuery<MeloloSearchResponse>({
    queryKey: ["melolo", "search", query],
    queryFn: () => fetchJson<MeloloSearchResponse>(`/api/melolo/search?query=${encodeURIComponent(query)}`),
    enabled: !!query,
  });
}

export function useMeloloDetail(bookId: string) {
  return useQuery<MeloloDetailResponse>({
    queryKey: ["melolo", "detail", bookId],
    queryFn: () => fetchJson<MeloloDetailResponse>(`/api/melolo/detail?bookId=${bookId}`),
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMeloloStream(videoId: string) {
  return useQuery<MeloloStreamResponse>({
    queryKey: ["melolo", "stream", videoId],
    queryFn: () => fetchJson<MeloloStreamResponse>(`/api/melolo/stream?videoId=${videoId}`),
    enabled: !!videoId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useInfiniteMelolo() {
  return useInfiniteQuery({
    queryKey: ["melolo", "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/melolo/explore?page=${pageParam}`);
      const json = await res.json();

      let data = json.data;
      if (typeof data === "string") {
        // You might need decryptData imported if Melolo response is encrypted
        // Assuming for now it follows standard pattern, if error occurs we add import
        // But based on current file imports, decryptData is NOT imported.
        // Since fetchJson handles decryption but here we use raw fetch for infinite query control...
        // We SHOULD rely on fetchJson logic effectively or handle it similarly.
        // Let's use fetchJson instead to be consistent with other hooks in this file.
        const fetchedData: any = await fetchJson(`/api/melolo/explore?page=${pageParam}`);
        data = fetchedData;
      } else {
        // if fetchJson wasn't used, we might have raw structure
        data = json.data || json;
      }

      const items = data.books || data.items || (Array.isArray(data) ? data : []);
      return (Array.isArray(items) ? items : []) as MeloloBook[];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 5) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 60 * 5,
  });
}
