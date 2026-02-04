import { NextRequest, NextResponse } from "next/server";
import { decryptData } from "@/lib/crypto";

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api");

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get("source");
    const bookId = searchParams.get("bookId");

    // For Dramabox
    const chapterId = searchParams.get("chapterId"); // Dramabox specific

    // For Melolo
    const videoId = searchParams.get("videoId"); // Melolo specific

    if (!source || !bookId) {
        return new NextResponse("Missing params", { status: 400 });
    }

    const host = request.headers.get("host") || "aepro.my.id";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const baseUrl = `${protocol}://${host}`;

    try {
        let finalUrl = "";

        if (source === "dramabox") {
            const url = `${BACKEND_BASE}/dramabox/allepisode?bookId=${bookId}`;
            const res = await fetch(url, { next: { revalidate: 300 } });
            const json = await res.json();

            let chapters = [];
            if (json.data && typeof json.data === 'string') {
                try {
                    const decrypted = decryptData<any>(json.data);
                    chapters = decrypted.chapterList || (Array.isArray(decrypted) ? decrypted : []);
                } catch (e) { }
            } else if (json.data?.chapterList) {
                chapters = json.data.chapterList;
            }

            const epNum = searchParams.get("ep");
            const chapter = chapters.find((c: any) => c.chapterId == chapterId || c.id == chapterId || (c.chapterIndex == epNum));

            if (!chapter) return new NextResponse("Chapter not found", { status: 404 });

            let videoUrl = chapter.videoUrl;
            if (chapter.cdnList?.length) {
                const defaultCdn = chapter.cdnList.find((c: any) => c.isDefault === 1) || chapter.cdnList[0];
                const defaultPath = defaultCdn.videoPathList?.find((v: any) => v.isDefault === 1 || v.quality === 720) || defaultCdn.videoPathList?.[0];
                if (defaultPath?.videoPath) videoUrl = defaultPath.videoPath;
            }

            if (videoUrl) {
                finalUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(videoUrl)}`;
            }

        } else if (source === "melolo") {
            const url = `${BACKEND_BASE}/melolo/detail?bookId=${bookId}`;
            const res = await fetch(url, { next: { revalidate: 300 } });
            const json = await res.json();

            let data = json.data;
            if (typeof data === 'string') {
                try { data = decryptData<any>(data); } catch (e) { }
            }
            const videoData = data?.video_data || data;
            // Gunakan String() untuk membandingkan ID agar tidak masalah tipe data (number vs string)
            const video = videoData?.video_list?.find((v: any) => String(v.vid) === String(videoId));

            if (!video) return new NextResponse("Video not found in Melolo list", { status: 404 });

            let realUrl = video.main_url;
            try {
                // Melolo often base64 encodes
                if (realUrl && !realUrl.startsWith("http")) {
                    realUrl = Buffer.from(realUrl, 'base64').toString('ascii');
                }
            } catch (e) {
                console.error("Melolo base64 error:", e);
            }

            if (realUrl) {
                // Jika sudah mengandung kata proxy, kembalikan langsung
                if (realUrl.includes('/api/proxy')) {
                    finalUrl = realUrl.startsWith('http') ? realUrl : `${baseUrl}${realUrl}`;
                } else {
                    finalUrl = `${baseUrl}/api/proxy/video?url=${encodeURIComponent(realUrl)}`;
                }
            }
        } else if (source === "reelshort") {
            const ep = searchParams.get("ep");
            const url = `${BACKEND_BASE}/reelshort/watch?bookId=${bookId}&chapterId=${ep}`;
            const res = await fetch(url);
            const json = await res.json();

            let data = json.data;
            if (typeof data === 'string') {
                try { data = decryptData<any>(data); } catch (e) { }
            }

            if (data?.videoUrl) {
                finalUrl = `${baseUrl}/api/proxy/video?url=${encodeURIComponent(data.videoUrl)}`;
            }
        } else if (source === "flickreels") {
            const url = `${baseUrl}/api/flickreels/detail?bookId=${bookId}`;
            const res = await fetch(url);
            const json = await res.json();

            let data = json.data;
            if (typeof data === 'string') {
                try { data = decryptData<any>(data); } catch (e) { }
            }

            const episodes = data?.episodes || [];
            const ep = episodes.find((e: any) => e.id === videoId || (e.index + 1).toString() === searchParams.get("ep"));

            if (ep?.raw?.videoUrl || ep?.videoUrl) {
                const vUrl = ep.raw?.videoUrl || ep.videoUrl;
                finalUrl = `${baseUrl}/api/proxy/video?url=${encodeURIComponent(vUrl)}&referer=${encodeURIComponent("https://www.flickreels.com/")}`;
            }
        }

        if (finalUrl) {
            return NextResponse.redirect(finalUrl, 302);
        } else {
            return new NextResponse("Stream URL not found", { status: 404 });
        }

    } catch (error: any) {
        console.error("Resolver Error:", error);
        return new NextResponse("Internal Error: " + error.message, { status: 500 });
    }
}
