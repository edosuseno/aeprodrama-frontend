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
            // Fetch ALL episodes again (inefficient but simplest for stateless)
            // Ideally we should cache this response
            const url = `${BACKEND_BASE}/dramabox/allepisode?bookId=${bookId}`;
            const res = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 mins
            const json = await res.json();

            let chapters = [];
            if (json.data && typeof json.data === 'string') {
                const decrypted = decryptData<any>(json.data);
                if (decrypted && decrypted.chapterList) chapters = decrypted.chapterList;
                else if (Array.isArray(decrypted)) chapters = decrypted;
            } else if (json.data?.chapterList) {
                chapters = json.data.chapterList;
            }

            const chapter = chapters.find((c: any) => c.chapterId == chapterId || c.id == chapterId);

            if (!chapter) return new NextResponse("Chapter not found", { status: 404 });

            // Logic to pick best video path
            let videoUrl = chapter.videoUrl;
            if (chapter.cdnList?.length) {
                const defaultCdn = chapter.cdnList.find((c: any) => c.isDefault === 1) || chapter.cdnList[0];
                const defaultPath = defaultCdn.videoPathList?.find((v: any) => v.isDefault === 1 || v.quality === 720) || defaultCdn.videoPathList?.[0];
                if (defaultPath?.videoPath) videoUrl = defaultPath.videoPath;
            }

            // Redirect through PROXY to assume identity
            if (videoUrl) {
                finalUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(videoUrl)}`;
            }

        } else if (source === "melolo") {
            const url = `${BACKEND_BASE}/melolo/detail?bookId=${bookId}`;
            const res = await fetch(url, { next: { revalidate: 300 } });
            const json = await res.json();

            const data = json.data?.video_data;
            const video = data?.video_list?.find((v: any) => v.vid === videoId);

            if (!video) return new NextResponse("Video not found", { status: 404 });

            // Decode URL
            let realUrl = video.main_url;
            try {
                // Melolo often base64 encodes
                // Check if it looks like base64 (no http at start)
                if (!realUrl.startsWith("http")) {
                    realUrl = atob(realUrl);
                }
            } catch (e) { }

            if (realUrl) {
                // Melolo needs Referer too, so use Proxy
                finalUrl = `${baseUrl}/api/proxy/video?url=${encodeURIComponent(realUrl)}`;
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
