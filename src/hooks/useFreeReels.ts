
"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

// Interfaces based on FreeReels JSON response
export interface FreeReelsItem {
  key: string;
  cover: string;
  title: string;
  desc: string;
  episode_count: number;
  follow_count: number;
  content_tags?: string[];
  container?: {
    kind: string;
    episode_info?: {
      id: string;
      name: string;
    };
    next_episode?: {
      id: string;
      name: string;
    };
  };
  link?: string;
  [key: string]: any;
}

export interface FreeReelsForYouResponse {
  code: number;
  message: string;
  data: {
    items: FreeReelsItem[];
  };
}

// ... types
export interface FreeReelsModule {
  type: string;
  module_name?: string;
  items: FreeReelsItem[];
  // For 'recommend' type which has nested card
  [key: string]: any;
}

export interface FreeReelsPageResponse {
  code: number;
  message: string;
  data: {
    items: FreeReelsModule[];
  };
}

export interface FreeReelsHomeResponse {
  code: number;
  message: string;
  data: {
    items: FreeReelsItem[];
  };
}

export interface FreeReelsDetailResponse {
  data: FreeReelsItem;
}

export function useFreeReelsForYou() {
  return useQuery<FreeReelsForYouResponse>({
    queryKey: ["freereels", "foryou"],
    queryFn: () => fetchJson<FreeReelsForYouResponse>("/api/freereels/foryou"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFreeReelsHome() {
  return useQuery<FreeReelsPageResponse>({
    queryKey: ["freereels", "home"],
    queryFn: () => fetchJson<FreeReelsPageResponse>("/api/freereels/home"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFreeReelsAnime() {
  return useQuery<FreeReelsPageResponse>({
    queryKey: ["freereels", "anime"],
    queryFn: () => fetchJson<FreeReelsPageResponse>("/api/freereels/anime"),
    staleTime: 5 * 60 * 1000,
  });
}

// Search Response Interface
export interface FreeReelsSearchItem {
  id: string;
  name: string;
  cover: string;
  desc?: string;
  episode_count?: number;
  [key: string]: any;
}

export interface FreeReelsSearchResponse {
  code: number;
  message: string;
  data: {
    items: FreeReelsSearchItem[];
  };
}

export async function fetchFreeReelsDetail(bookId: string) {
    const response = await fetchJson<any>(`/api/freereels/detail?id=${bookId}`);
    
    // Normalization logic (sama dengan select di hook)
    let info = response?.data?.info
        || response?.data
        || response?.info
        || response;

    if (!info || (!info.id && !info.name && !info.title && !info.key)) {
        return null;
    }

    const rawTags = info.content_tags || info.tags || info.tagNames;
    const contentTags: string[] = Array.isArray(rawTags)
        ? rawTags
        : (typeof rawTags === "string" && rawTags.trim()
            ? rawTags.split(/[\s,|]+/).filter(Boolean)
            : []);

    const normalizedInfo = {
        ...info,
        id: info.id || info.key || bookId,
        name: info.name || info.title || "Judul tidak tersedia",
        cover: info.cover || info.coverWap || info.image || "",
        desc: info.desc || info.description || info.introduce || info.abstract || "",
        episode_count: info.episode_count || info.chapterCount || info.totalEpisodes || 0,
        content_tags: contentTags,
        follow_count: info.follow_count || info.followCount || 0,
    };

    const rawEpisodeList = info.episode_list;
    const isValidArray = Array.isArray(rawEpisodeList) && rawEpisodeList.length > 0;
    const episodeList = isValidArray
        ? rawEpisodeList
        : (info.chapterList || info.episodes || []);

    const singleEpisode = info.episode && !isValidArray ? [info.episode] : [];
    const allEpisodes = episodeList.length > 0 ? episodeList : singleEpisode;

    const episodes = allEpisodes.map((ep: any, idx: number) => {
        const indoSub = Array.isArray(ep.subtitle_list)
            ? ep.subtitle_list.find((sub: any) => sub.language === 'id-ID')
            : undefined;
        return {
            id: ep.id || ep.chapterId || String(idx + 1),
            name: ep.name || ep.chapterName || ep.title || `Episode ${idx + 1}`,
            index: ep.index ?? ep.chapterIndex ?? idx,
            videoUrl: ep.video_url || ep.videoUrl || ep.external_audio_h264_m3u8 || ep.mp4 || "",
            m3u8_url: ep.m3u8_url || ep.hlsUrl || "",
            external_audio_h264_m3u8: ep.external_audio_h264_m3u8 || "",
            external_audio_h265_m3u8: ep.external_audio_h265_m3u8 || "",
            cover: ep.cover || normalizedInfo.cover,
            subtitleUrl: indoSub?.subtitle || indoSub?.vtt || "",
            originalAudioLanguage: ep.original_audio_language || "",
        };
    });

    return {
        data: {
            ...normalizedInfo,
            key: normalizedInfo.id,
            title: normalizedInfo.name,
            episodes: episodes,
        } as FreeReelsItem,
    };
}

export function useFreeReelsDetail(bookId: string) {
  return useQuery({
    queryKey: ["freereels", "detail", bookId],
    queryFn: () => fetchFreeReelsDetail(bookId),
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFreeReelsSearch(query: string) {
  return useQuery({
    queryKey: ["freereels", "search", query],
    queryFn: () => fetchJson<FreeReelsSearchResponse>(`/api/freereels/search?query=${encodeURIComponent(query)}`),
    select: (response) => {
      // Transform search items to FreeReelsItem format
      return response.data?.items?.map(item => ({
        ...item,
        key: item.id || item.key,
        title: item.title || item.name || item.shortPlayName,
        follow_count: item.follow_count || 0,
      })) as FreeReelsItem[] || [];
    },
    enabled: !!query,
    staleTime: 60 * 1000,
  });
}

export function useInfiniteFreeReels() {
  return useInfiniteQuery({
    queryKey: ["freereels", "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      // Use fetchJson to handle decryption automatically
      const fetchedData: any = await fetchJson(`/api/freereels/explore?page=${pageParam}`);

      const items = fetchedData.items || fetchedData.list || (Array.isArray(fetchedData) ? fetchedData : []);
      // Transform items if needed (similar to search or detail but here items usually are minimal)
      // FreeReels items in list usually have: id, name, cover, etc.
      return (items.map((item: any) => ({
        ...item,
        key: item.id || item.key, // ensure key/id
        title: item.name || item.title,
        cover: item.cover,
      })) || []) as FreeReelsItem[];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 5) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 60 * 5,
  });
}
