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

/**
 * Fallback: Panggil vidrama server action langsung dari browser (client-side)
 * Digunakan saat backend Vercel diblokir Cloudflare (403 challenge)
 */
async function fetchStreamFromVidramaDirect(shortPlayId: string, episodeNumber: number) {
    const actionId = '700a88bb402f0a83f0ac8d827995d0ad3ac3d56b53';
    const url = `https://vidrama.asia/watch/drama--${shortPlayId}/${episodeNumber}?provider=shortmax&lang=id`;
    const payload = [String(shortPlayId), Number(episodeNumber), "id"];

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'text/x-component',
            'Content-Type': 'text/plain;charset=UTF-8',
            'Next-Action': actionId,
            'Next-Router-State-Tree': '%5Bnull%2Cnull%2Cnull%2Cnull%5D',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Vidrama direct: ${res.status}`);
    const text = await res.text();

    // Parse RSC response — cari line yang mengandung "videoUrl"
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.includes('"videoUrl"')) {
            const jsonStr = line.replace(/^[0-9a-zA-Z]+:/, '');
            try {
                const data = JSON.parse(jsonStr);
                let streamUrl: string | null = null;
                if (data.qualities?.video_720) {
                    streamUrl = data.qualities.video_720;
                } else if (data.videoUrl?.includes('url=')) {
                    streamUrl = decodeURIComponent(data.videoUrl.split('url=')[1]);
                } else if (data.url?.includes('url=')) {
                    streamUrl = decodeURIComponent(data.url.split('url=')[1]);
                }
                if (streamUrl) {
                    // Proxy melalui vidrama.asia agar tidak kena CORS Akamai
                    const proxyUrl = `https://vidrama.asia/api/shortmax/proxy?url=${encodeURIComponent(streamUrl)}`;
                    return {
                        url: proxyUrl,
                        episode: { videoUrl: proxyUrl },
                        subtitles: [],
                        subtitle: null,
                        provider: 'shortmax' as const
                    };
                }
            } catch (e) { /* parse error, skip */ }
        }
    }
    throw new Error('Video URL tidak ditemukan di response vidrama');
}

export function useShortMaxEpisode(shortPlayId: string, episodeNumber: number) {
    return useQuery<{ shortPlayId: string; shortPlayName: string; episode: any }>({
        queryKey: ["shortmax", "episode", shortPlayId, episodeNumber],
        queryFn: async () => {
            // Step 1: Coba backend dulu (berfungsi di lokal, mungkin gagal di Vercel)
            try {
                const response = await fetch(`/api/shortmax/episode?shortPlayId=${shortPlayId}&episodeNumber=${episodeNumber}`);
                if (response.ok) {
                    const json = await response.json();

                    // Jika data terenkripsi (string), dekripsi dulu
                    if (json.data && typeof json.data === "string") {
                        const decrypted = decryptData(json.data) as any;
                        const streamData = decrypted?.data || decrypted;
                        const episodeObj = streamData?.episode || streamData;
                        
                        // Cek apakah data valid (bukan null)
                        const videoUrl = episodeObj?.videoUrl || streamData?.url;
                        if (videoUrl) {
                            return { 
                                ...json, 
                                ...streamData,
                                episode: episodeObj
                            };
                        }
                        // Data null/kosong → jatuh ke fallback
                        console.log('[ShortMax] Backend mengembalikan data kosong, mencoba fallback vidrama langsung...');
                    } else if (json.episode?.videoUrl || json.url) {
                        return json;
                    }
                }
            } catch (backendErr) {
                console.log('[ShortMax] Backend error, mencoba fallback vidrama langsung...', backendErr);
            }

            // Step 2: Fallback — panggil vidrama.asia langsung dari browser
            // Ini bypass Cloudflare karena IP browser user tidak diblokir
            console.log('[ShortMax] Menggunakan fallback: vidrama.asia direct client-side call');
            const directData = await fetchStreamFromVidramaDirect(shortPlayId, episodeNumber);
            return {
                episode: directData.episode,
                url: directData.url,
                provider: 'shortmax'
            };
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
