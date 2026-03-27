import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // getBackendBase() mengembalikan URL dengan /api, contoh: http://localhost:5001/api
    const BACKEND_API = getBackendBase();
    // Untuk resolve path relatif dari backend (misal /api/dramabox/proxy?...),
    // kita butuh origin tanpa /api di akhir
    const BACKEND_ORIGIN = BACKEND_API.replace(/\/api$/, '');

    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get("source");
    const bookId = searchParams.get("bookId");
    const chapterId = searchParams.get("chapterId") || searchParams.get("videoId");
    const ep = searchParams.get("ep");

    if (!source || !bookId) {
        return new NextResponse("Missing params", { status: 400 });
    }

    try {
        // 1. Fetch URL video dari backend dengan redirect: 'manual'
        //    Agar kita bisa ambil Location header-nya tanpa browser follow redirect (yang bisa CORS-blocked)
        const backendUrl = `${BACKEND_API}/tools/resolve?source=${source}&bookId=${bookId}&chapterId=${chapterId}&ep=${ep}`;
        console.log(`[Resolver] Fetching from Backend: ${backendUrl}`);

        const backendRes = await fetch(backendUrl, {
            redirect: 'manual',
            headers: {
                'Accept': '*/*',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        // Backend mengirim redirect 302 ke URL video (atau /api/dramabox/proxy?url=...)
        if (backendRes.status === 302 || backendRes.status === 301) {
            const location = backendRes.headers.get('location');
            if (!location) {
                return new NextResponse("Backend returned redirect with no Location", { status: 502 });
            }

            // Jika Location adalah path relatif (misal /api/dramabox/proxy?url=...),
            // jadikan URL absolut menggunakan BACKEND_ORIGIN
            let videoUrl = location;
            if (location.startsWith('/')) {
                videoUrl = `${BACKEND_ORIGIN}${location}`;
            }

            console.log(`[Resolver] Got redirect to: ${videoUrl.substring(0, 80)}...`);

            // 2. Wrap URL video melalui /api/proxy/video (Next.js same-origin proxy)
            //    Ini memastikan HLS.js bisa fetch tanpa CORS issue
            const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
            const proto = request.headers.get("x-forwarded-proto") || "http";
            const origin = `${proto}://${host}`;

            const proxiedUrl = `${origin}/api/proxy/video?url=${encodeURIComponent(videoUrl)}`;
            console.log(`[Resolver] Proxying through: ${proxiedUrl.substring(0, 80)}...`);

            // Redirect ke Next.js proxy (same-origin, CORS-safe)
            return NextResponse.redirect(proxiedUrl, 302);
        }

        // Kalau backend return 404 / 500
        const body = await backendRes.text();
        console.error(`[Resolver] Backend error ${backendRes.status}: ${body}`);
        return new NextResponse(`Video not found (${backendRes.status})`, {
            status: backendRes.status >= 400 ? backendRes.status : 404
        });

    } catch (error: any) {
        console.error("[Resolver] Error:", error);
        return new NextResponse("Internal Error: " + error.message, { status: 500 });
    }
}
