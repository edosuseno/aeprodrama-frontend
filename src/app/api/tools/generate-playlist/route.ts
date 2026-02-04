import { NextRequest, NextResponse } from "next/server";
import { decryptData } from "@/lib/crypto";

// Use the same backend URL as used in other proxies
const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api");

export async function POST(request: NextRequest) {
    try {
        const { source, bookId } = await request.json();

        if (!source || !bookId) {
            return NextResponse.json({ error: "Missing source or bookId" }, { status: 400 });
        }

        const host = request.headers.get("host") || "aepro.my.id";
        const protocol = request.headers.get("x-forwarded-proto") || "https";
        const baseUrl = `${protocol}://${host}`;

        let playlistContent = "#EXTM3U\n";
        let title = `${source}-${bookId}`;

        if (source === "dramabox") {
            const fetchEpisodes = async (apiUrl: string) => {
                try {
                    const res = await fetch(apiUrl);
                    if (!res.ok) return [];
                    const json = await res.json();
                    let data = json.data;
                    if (typeof data === 'string') {
                        try { data = decryptData<any>(data); } catch (e) { return []; }
                    }
                    return data?.chapterList || data?.episodes || (Array.isArray(data) ? data : []);
                } catch (e) { return []; }
            };

            // 1. Cek Backend Base (Local Proxy/Sansekai)
            let chapters = await fetchEpisodes(`${BACKEND_BASE}/dramabox/allepisode?bookId=${bookId}`);

            // 2. Fallback ke Sansekai Direct jika kosong
            if (!chapters.length) {
                chapters = await fetchEpisodes(`https://api.sansekai.my.id/api/dramabox/allepisode/${bookId}`);
            }

            // 3. Fallback Detail jika masih kosong
            if (!chapters.length) {
                const detailRes = await fetch(`${BACKEND_BASE}/dramabox/detail/${bookId}`);
                if (detailRes.ok) {
                    const detailJson = await detailRes.ok ? await detailRes.json() : {};
                    let detailData = detailJson.data;
                    if (typeof detailData === 'string') {
                        try { detailData = decryptData<any>(detailData); } catch (e) { }
                    }
                    chapters = detailData?.chapterList || detailData?.episodes || [];
                }
            }

            if (!chapters || chapters.length === 0) {
                return NextResponse.json({ error: "No episodes found. Link Dramabox ini mungkin memerlukan login atau data belum tersedia di cache." }, { status: 404 });
            }

            if (!chapters || chapters.length === 0) {
                return NextResponse.json({ error: "No episodes found. Try watching at least one episode first to populate cache." }, { status: 404 });
            }

            title = `DramaBox-${bookId}`;

            chapters.forEach((ep: any) => {
                const epIndex = ep.chapterIndex || ep.index || ep.episodeIndex || ep.episodeNo;
                const chId = ep.id || ep.chapterId;
                const resolveUrl = `${baseUrl}/api/tools/stream-resolver?source=dramabox&bookId=${bookId}&chapterId=${chId}&ep=${epIndex}`;
                playlistContent += `#EXTINF:-1, Episode ${epIndex}\n${resolveUrl}\n`;
            });

        } else if (source === "melolo") {
            const url = `${BACKEND_BASE}/melolo/detail?bookId=${bookId}`;
            const res = await fetch(url);
            const json = await res.json();

            let data = json.data;
            if (typeof data === 'string') {
                try { data = decryptData<any>(data); } catch (e) { }
            }

            const drama = data?.video_data || data;
            if (!drama || !drama.video_list) {
                return NextResponse.json({ error: "Melolo drama not found" }, { status: 404 });
            }

            title = `Melolo-${drama.series_title || bookId}`;

            drama.video_list.forEach((video: any, index: number) => {
                const epNum = index + 1;
                const resolveUrl = `${baseUrl}/api/tools/stream-resolver?source=melolo&bookId=${bookId}&videoId=${video.vid}&ep=${epNum}`;
                playlistContent += `#EXTINF:-1, Episode ${epNum}\n${resolveUrl}\n`;
            });
        } else if (source === "reelshort") {
            const url = `${BACKEND_BASE}/reelshort/detail?bookId=${bookId}`;
            const res = await fetch(url);
            const json = await res.json();

            let data = json.data;
            if (typeof data === 'string') {
                try { data = decryptData<any>(data); } catch (e) { }
            }

            if (!data) return NextResponse.json({ error: "ReelShort drama not found" }, { status: 404 });

            const totalEp = data.totalEpisodes || data.episodes?.length || 0;
            title = `ReelShort-${data.title || data.bookName || bookId}`;

            for (let i = 1; i <= totalEp; i++) {
                const resolveUrl = `${baseUrl}/api/tools/stream-resolver?source=reelshort&bookId=${bookId}&ep=${i}`;
                playlistContent += `#EXTINF:-1, Episode ${i}\n${resolveUrl}\n`;
            }
        } else if (source === "flickreels") {
            const url = `${baseUrl}/api/flickreels/detail?bookId=${bookId}`;
            const res = await fetch(url);
            const json = await res.json();

            let data = json.data;
            if (typeof data === 'string') {
                try { data = decryptData<any>(data); } catch (e) { }
            }

            if (!data || !data.episodes) return NextResponse.json({ error: "FlickReels drama not found" }, { status: 404 });

            title = `FlickReels-${data.drama?.title || bookId}`;

            data.episodes.forEach((ep: any) => {
                const epNum = ep.index + 1;
                const resolveUrl = `${baseUrl}/api/tools/stream-resolver?source=flickreels&bookId=${bookId}&videoId=${ep.id}&ep=${epNum}`;
                playlistContent += `#EXTINF:-1, Episode ${epNum}\n${resolveUrl}\n`;
            });
        }
        else {
            return NextResponse.json({ error: "Source not supported yet" }, { status: 400 });
        }

        return new NextResponse(playlistContent, {
            headers: {
                "Content-Type": "application/x-mpegurl", // or audio/x-mpegurl
                "Content-Disposition": `attachment; filename="${title}.m3u8"`
            }
        });

    } catch (error: any) {
        console.error("Generate Playlist Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
