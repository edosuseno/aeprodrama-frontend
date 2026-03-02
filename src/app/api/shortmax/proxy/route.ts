import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

const UPSTREAM_API = getBackendBase();

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const videoUrl = searchParams.get("url");

    if (!videoUrl) {
        return NextResponse.json({ error: "URL parameter diperlukan" }, { status: 400 });
    }

    try {
        // Teruskan request ke backend proxy
        const proxyUrl = `${UPSTREAM_API}/shortmax/proxy?url=${encodeURIComponent(videoUrl)}`;
        const upstream = await fetch(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
            cache: 'no-store',
        });

        const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
        const body = await upstream.arrayBuffer();

        return new NextResponse(body, {
            status: upstream.status,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache',
            }
        });
    } catch (error) {
        console.error("[ShortMax Proxy FE] Error:", error);
        return NextResponse.json({ error: "Gagal memproksikan konten" }, { status: 502 });
    }
}
