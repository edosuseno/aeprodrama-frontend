import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Ambil base URL backend
function getBackend(): string {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";
    return base.endsWith('/api') ? base : `${base}/api`;
}

/**
 * Catch-all API proxy route
 * Menggantikan semua route individual agar tidak melebihi limit Vercel Hobby (12 functions).
 * 
 * Pattern URL:
 *   /api/[provider]/[endpoint]?params  →  backend/api/[provider]/[endpoint]?params
 *
 * Route khusus yang TIDAK ditangani di sini (punya file sendiri):
 *   - /api/proxy/video      (streaming video dengan Node http/https)
 *   - /api/proxy/warmup     (warmup CDN link)
 *   - /api/tools/generate-playlist (POST, download file)
 */

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const pathSegments = params.path; // misal: ["shortmax", "detail"] atau ["dramabox", "explore"]
    const pathStr = pathSegments.join('/');

    // Redirect route proxy/video dan proxy/warmup ke handler khusus mereka
    // (seharusnya tidak masuk sini karena file route.ts mereka ada, tapi jaga-jaga)
    if (pathStr.startsWith('proxy/') || pathStr.startsWith('tools/')) {
        return NextResponse.json({ error: 'Use specific route' }, { status: 400 });
    }

    const backend = getBackend();
    const queryString = request.nextUrl.search; // termasuk '?'
    const upstreamUrl = `${backend}/${pathStr}${queryString}`;

    try {
        const upstream = await fetch(upstreamUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(15000),
        });

        const contentType = upstream.headers.get('content-type') || 'application/json';
        const body = await upstream.arrayBuffer();

        return new NextResponse(body, {
            status: upstream.status,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache',
            }
        });
    } catch (error: any) {
        console.error(`[API Proxy] Error for ${pathStr}:`, error.message);
        return NextResponse.json(
            { success: false, message: `Gagal menghubungi backend: ${error.message}` },
            { status: 502 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const pathStr = params.path.join('/');
    const backend = getBackend();
    const queryString = request.nextUrl.search;
    const upstreamUrl = `${backend}/${pathStr}${queryString}`;

    try {
        const body = await request.text();
        const upstream = await fetch(upstreamUrl, {
            method: 'POST',
            headers: {
                'Content-Type': request.headers.get('content-type') || 'application/json',
            },
            body,
            cache: 'no-store',
            signal: AbortSignal.timeout(15000),
        });

        const contentType = upstream.headers.get('content-type') || 'application/json';
        const respBody = await upstream.arrayBuffer();

        return new NextResponse(respBody, {
            status: upstream.status,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error: any) {
        console.error(`[API Proxy POST] Error for ${pathStr}:`, error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 502 });
    }
}
