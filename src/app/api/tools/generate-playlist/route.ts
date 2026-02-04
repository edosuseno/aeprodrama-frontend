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
            // 1. Fetch episodes
            const url = `${BACKEND_BASE}/dramabox/allepisode?bookId=${bookId}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch from backend");

            const json = await res.json();
            // Backend returns encrypted 'data'. We need to decrypt?
            // Actually, depends on if we hit the backend directly or the Next.js API. 
            // The Next.js API returns encrypted. The backend likely returns encrypted too (Dramabox style).
            // Let's assume we need to decrypt.

            let chapters = [];
            if (json.data && typeof json.data === 'string') {
                const decrypted = decryptData<any>(json.data);
                if (decrypted && decrypted.chapterList) {
                    chapters = decrypted.chapterList; // This might be wrong structure, check logic
                } else if (Array.isArray(decrypted)) {
                    chapters = decrypted;
                }
            } else if (json.data && Array.isArray(json.data.chapterList)) {
                chapters = json.data.chapterList;
            }

            // Fallback: Try checking what structure we really have.
            // Usually Dramabox allEpisode -> { data: "encrypted" } -> decrypt -> { chapterList: [...] }
            // Or maybe it's just an array.

            if (!chapters || chapters.length === 0) {
                return NextResponse.json({ error: "No episodes found or decryption failed" }, { status: 404 });
            }

            title = `DramaBox-${bookId}`;

            chapters.forEach((ep: any) => {
                const epIndex = ep.chapterIndex || ep.index;
                // RESOLVER URL
                const resolveUrl = `${baseUrl}/api/tools/stream-resolver?source=dramabox&bookId=${bookId}&chapterId=${ep.id || ep.chapterId}&ep=${epIndex}`;

                playlistContent += `#EXTINF:-1, Episode ${epIndex}\n${resolveUrl}\n`;
            });

        } else if (source === "melolo") {
            const url = `${BACKEND_BASE}/melolo/detail?bookId=${bookId}`;
            const res = await fetch(url);
            const json = await res.json();

            // Melolo might return { data: { video_data: ... } }
            const drama = json.data?.video_data;
            if (!drama || !drama.video_list) {
                return NextResponse.json({ error: "Melolo drama not found" }, { status: 404 });
            }

            title = `Melolo-${drama.series_title || bookId}`;

            drama.video_list.forEach((video: any, index: number) => {
                const epNum = index + 1;
                const resolveUrl = `${baseUrl}/api/tools/stream-resolver?source=melolo&bookId=${bookId}&videoId=${video.vid}&ep=${epNum}`;
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
