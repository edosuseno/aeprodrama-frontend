"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

// --- Types ---

export interface MovieBoxItem {
    id: string;
    title: string;
    poster: string;
    type?: string;
    url?: string;
    quality?: string;
    rating?: string;
    release?: string;
    duration?: string;
    [key: string]: any;
}

export interface MovieBoxDetail extends MovieBoxItem {
    synopsis: string;
    genre: string[];
    cast: string[];
    country: string;
    director: string;
    episodes?: {
        id: string;
        title: string;
        url: string;
    }[];
}

export interface MovieBoxSource {
    url: string;
    quality: string;
    isM3U8: boolean;
    referer?: string;
    isEmbed?: boolean;
    type?: string;
    provider?: string;
}

export interface MovieBoxGeneratedStream {
    file: string; // url
    type: string;
}

export interface MovieBoxExploreResponse {
    data: MovieBoxItem[];
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
}

// --- Hooks ---

export function useMovieBoxHome() {
    return useQuery({
        queryKey: ["moviebox", "home"],
        queryFn: () => fetchJson<{ data: any }>("/api/moviebox/homepage"),
        staleTime: 5 * 60 * 1000,
    });
}

export function useMovieBoxTrending() {
    return useQuery({
        queryKey: ["moviebox", "trending"],
        queryFn: () => fetchJson<{ data: MovieBoxItem[] }>("/api/moviebox/trending"),
        staleTime: 5 * 60 * 1000,
    });
}

export function useMovieBoxPopular() {
    return useQuery({
        queryKey: ["moviebox", "popular"],
        queryFn: () => fetchJson<{ data: MovieBoxItem[] }>("/api/moviebox/popular"),
        staleTime: 5 * 60 * 1000,
    });
}

export function useMovieBoxNowPlaying() {
    return useQuery({
        queryKey: ["moviebox", "nowplaying"],
        queryFn: () => fetchJson<{ data: MovieBoxItem[] }>("/api/moviebox/now-playing"),
        staleTime: 5 * 60 * 1000,
    });
}

export function useMovieBoxUpcoming() {
    return useQuery({
        queryKey: ["moviebox", "upcoming"],
        queryFn: () => fetchJson<{ data: MovieBoxItem[] }>("/api/moviebox/upcoming"),
        staleTime: 5 * 60 * 1000,
    });
}

export function useMovieBoxSearch(query: string) {
    return useQuery({
        queryKey: ["moviebox", "search", query],
        queryFn: () => fetchJson<{ data: MovieBoxItem[] }>(`/api/moviebox/search?query=${encodeURIComponent(query)}`),
        enabled: !!query,
        staleTime: 60 * 1000,
    });
}

export function useMovieBoxDetail(id: string) {
    return useQuery({
        queryKey: ["moviebox", "detail", id],
        queryFn: () => fetchJson<{ data: MovieBoxDetail }>(`/api/moviebox/detail?id=${id}`),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useMovieBoxSources(id: string, episodeId?: string) {
    return useQuery({
        queryKey: ["moviebox", "sources", id, episodeId],
        queryFn: () => fetchJson<{ data: MovieBoxSource[] }>(`/api/moviebox/sources?id=${id}&episodeId=${episodeId || ""}`),
        enabled: !!id,
        staleTime: 0, // Always get fresh links for playback
    });
}

export function useMovieBoxGenerate(url: string) {
    return useQuery({
        queryKey: ["moviebox", "generate", url],
        queryFn: () => fetchJson<{ data: MovieBoxGeneratedStream }>(`/api/moviebox/generate?url=${encodeURIComponent(url)}`),
        enabled: !!url,
    });
}

export function useMovieBoxExplore() {
    return useInfiniteQuery({
        queryKey: ["moviebox", "explore"],
        queryFn: ({ pageParam = 1 }) =>
            fetchJson<MovieBoxExploreResponse>(`/api/moviebox/explore?page=${pageParam}`),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.currentPage + 1 : undefined,
    });
}
