import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    const urlStr = request.nextUrl.searchParams.get("url");
    const refererParam = request.nextUrl.searchParams.get("referer") || "https://vidrama.asia/";

    if (!urlStr) return new NextResponse("Missing URL", { status: 400 });

    try {
        // Teruskan permintaan ini ke backend proxy asli di port 5001 (Universal Proxy)
        const backendUrl = `${getBackendBase()}/proxy?url=${encodeURIComponent(urlStr)}&referer=${encodeURIComponent(refererParam)}`;
        
        const response = await fetch(backendUrl, {
            headers: {
                // Teruskan Range header dari browser agar durasi muncul
                "Range": request.headers.get("range") || "",
            },
            cache: 'no-store'
        });

        // Buat objek response baru untuk diteruskan ke browser
        const responseHeaders = new Headers();
        // Berikan izin CORS penuh agar video player tidak terhalang
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
        responseHeaders.set("Access-Control-Allow-Headers", "Range, Content-Type");
        responseHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Range");

        // Teruskan header multimedia penting dari backend
        if (response.headers.get("Content-Type")) responseHeaders.set("Content-Type", response.headers.get("Content-Type")!);
        if (response.headers.get("Content-Length")) responseHeaders.set("Content-Length", response.headers.get("Content-Length")!);
        if (response.headers.get("Content-Range")) responseHeaders.set("Content-Range", response.headers.get("Content-Range")!);
        if (response.headers.get("Accept-Ranges")) responseHeaders.set("Accept-Ranges", response.headers.get("Accept-Ranges")!);

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });

    } catch (error: any) {
        console.error("Video Proxy (DotDrama) Error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
