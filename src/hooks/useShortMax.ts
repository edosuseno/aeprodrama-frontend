"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";
import { decryptData } from "@/lib/crypto";

export interface ShortMaxDrama {
    shortPlayId: number | string;
    title: string;
    cover: string;
    horizontalCover?: string;
    totalEpisodes: number;
    label?: string;
    summary?: string;
}

export interface ShortMaxDramaDetail {
    shortPlayId: number | string;
    title: string;
    cover: string;
    description: string;
    totalEpisodes: number;
    updateEpisode: number;
    episodes?: any[];
}

export function useShortMaxLatest(enabled: boolean = true) {
    return useQuery<ShortMaxDrama[]>({
        queryKey: ["shortmax", "latest"],
        queryFn: () => fetchJson<ShortMaxDrama[]>("/api/shortmax/latest"),
        staleTime: 5 * 60 * 1000,
        enabled
    });
}

export function useShortMaxRekomendasi() {
    return useQuery<ShortMaxDrama[]>({
        queryKey: ["shortmax", "rekomendasi"],
        queryFn: () => fetchJson<ShortMaxDrama[]>("/api/shortmax/rekomendasi"),
        staleTime: 5 * 60 * 1000,
    });
}

export function useShortMaxSearch(query: string) {
    return useQuery<ShortMaxDrama[]>({
        queryKey: ["shortmax", "search", query],
        queryFn: () => fetchJson<ShortMaxDrama[]>(`/api/shortmax/search?query=${encodeURIComponent(query)}`),
        enabled: query.length > 0,
        staleTime: 2 * 60 * 1000,
    });
}

export async function fetchShortMaxDetail(shortPlayId: string): Promise<ShortMaxDramaDetail> {
    return fetchJson<ShortMaxDramaDetail>(`/api/shortmax/detail?shortPlayId=${shortPlayId}`);
}

export function useShortMaxDetail(shortPlayId: string) {
    return useQuery<ShortMaxDramaDetail>({
        queryKey: ["shortmax", "detail", shortPlayId],
        queryFn: () => fetchShortMaxDetail(shortPlayId),
        enabled: !!shortPlayId,
        staleTime: 10 * 60 * 1000,
    });
}

export function useShortMaxEpisode(shortPlayId: string, episodeNumber: number) {
    return useQuery<{ shortPlayId: string; shortPlayName: string; episode: any }>({
        queryKey: ["shortmax", "episode", shortPlayId, episodeNumber],
        queryFn: async () => {
            const response = await fetch(`/api/shortmax/episode?shortPlayId=${shortPlayId}&episodeNumber=${episodeNumber}`);
            if (!response.ok) throw new Error("Failed to fetch episode");
            const json = await response.json();

            // Jika data terenkripsi (string), dekripsi dulu
            if (json.data && typeof json.data === "string") {
                const decrypted = decryptData(json.data) as any;
                // decrypted = { url: "...", episode: { videoUrl: "..." }, provider: "shortmax" }
                // Ambil sub-properti .episode jika ada, fallback ke seluruh objek
                const streamData = decrypted?.data || decrypted;
                const episodeObj = streamData?.episode || streamData;
                return { 
                    ...json, 
                    ...streamData,
                    episode: episodeObj // Pastikan episode.videoUrl terbaca oleh Watch Page
                };
            }

            return json;
        },
        enabled: !!shortPlayId && !!episodeNumber,
        staleTime: 5 * 60 * 1000,
    });
}

export function useInfiniteShortMax() {
    return useInfiniteQuery({
        queryKey: ["shortmax", "infinite"],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await fetch(`/api/shortmax/foryou?page=${pageParam}`);
            const json = await res.json();
            let data = json;

            if (json.data && typeof json.data === "string") {
                data = decryptData(json.data);
            }

            const items = data.data || (Array.isArray(data) ? data : []);
            return items as ShortMaxDrama[];
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < 5) return undefined;
            return allPages.length + 1;
        },
        staleTime: 1000 * 60 * 5,
    });
}
