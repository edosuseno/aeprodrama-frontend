import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";
import https from "https";
import http from "http";

export const dynamic = "force-dynamic";

/**
 * /api/dramabox/stream — Next.js Same-Origin Video Proxy untuk DramaBox CDN
 *
 * Kenapa dipisah dari /api/proxy/video?
 * DramaBox CDN butuh header spesifik (Referer: dramabox.com, User-Agent DramaBox app)
 * yang berbeda dari CDN lain. Route ini memforward request ke backend /api/dramabox/proxy
 * yang sudah kita konfigurasi headernya dengan benar, lalu meneruskan responnya ke browser.
 * Ini WAJIB same-origin agar HLS.js bisa fetch manifest + segmen tanpa CORS error.
 */

// Agent khusus DramaBox CDN
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function fetchFromBackend(url: string, range?: string | null): Promise<{ res: http.IncomingMessage }> {
    return new Promise((resolve, reject) => {
        const isHttp = url.startsWith("http:");
        const mod = isHttp ? http : https;
        const reqOpts: any = {
            method: "GET",
            headers: {
                "Accept": "*/*",
                "User-Agent": "Mozilla/5.0",
                ...(range ? { "Range": range } : {})
            },
            agent: isHttp ? undefined : httpsAgent,
        };

        const req = mod.request(url, reqOpts, (res) => {
            // Follow redirect sekali (backend bisa redirect ke CDN final)
            if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume();
                return fetchFromBackend(res.headers.location, range)
                    .then(resolve)
                    .catch(reject);
            }
            resolve({ res });
        });
        req.on("error", reject);
        req.end();
    });
}

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
        return new NextResponse("Missing url param", { status: 400 });
    }

    try {
        const BACKEND_ORIGIN = getBackendBase().replace(/\/api$/, "");
        const range = request.headers.get("range");

        // Forward ke backend DramaBox proxy yang sudah punya header yang tepat
        const backendProxyUrl = `${BACKEND_ORIGIN}/api/dramabox/proxy?url=${encodeURIComponent(url)}`;

        const { res } = await fetchFromBackend(backendProxyUrl, range);

        const contentType = res.headers["content-type"] || "application/vnd.apple.mpegurl";
        const statusCode = res.statusCode || 200;

        // Baca response sebagai stream
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", resolve);
            res.on("error", reject);
        });

        const body = Buffer.concat(chunks);
        const text = body.toString("utf-8");

        // Jika konten M3U8, rewrite segmen URL agar tetap same-origin
        const isM3u8 =
            contentType.includes("mpegurl") ||
            text.trimStart().startsWith("#EXTM3U");

        if (isM3u8) {
            // Rewrite semua segmen/URL di manifest agar lewat route ini juga (same-origin)
            const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
            const proto = request.headers.get("x-forwarded-proto") || "http";
            const origin = `${proto}://${host}`;

            const rewritten = text.split(/\r?\n/).map((line) => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith("#")) return line;

                // Segmen URL sudah absolute (backend sudah rewrite jadi /api/dramabox/proxy?url=...)
                // Jadikan absolute URL backend lalu wrap ke /api/dramabox/stream
                let absoluteUrl = trimmed;
                if (trimmed.startsWith("/")) {
                    absoluteUrl = `${BACKEND_ORIGIN}${trimmed}`;
                }

                // Wrap di /api/dramabox/stream agar same-origin
                if (absoluteUrl.startsWith("http")) {
                    // Ekstrak URL asli dari backend proxy jika sudah wrapped
                    const urlParam = (() => {
                        try {
                            const parsed = new URL(absoluteUrl);
                            const innerUrl = parsed.searchParams.get("url");
                            return innerUrl || absoluteUrl;
                        } catch {
                            return absoluteUrl;
                        }
                    })();
                    return `${origin}/api/dramabox/stream?url=${encodeURIComponent(urlParam)}`;
                }
                return line;
            }).join("\n");

            return new NextResponse(rewritten, {
                status: 200,
                headers: {
                    "Content-Type": "application/vnd.apple.mpegurl",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-store",
                },
            });
        }

        // Binary content (segmen .ts, mp4, dll) — stream langsung
        const respHeaders = new Headers();
        respHeaders.set("Content-Type", contentType);
        respHeaders.set("Access-Control-Allow-Origin", "*");
        respHeaders.set("Accept-Ranges", "bytes");
        if (res.headers["content-length"]) respHeaders.set("Content-Length", res.headers["content-length"] as string);
        if (res.headers["content-range"]) respHeaders.set("Content-Range", res.headers["content-range"] as string);

        return new NextResponse(body, {
            status: statusCode,
            headers: respHeaders,
        });

    } catch (error: any) {
        console.error("[DramaBox Stream] Error:", error.message);
        return new NextResponse("Stream error: " + error.message, {
            status: 502,
            headers: { "Access-Control-Allow-Origin": "*" },
        });
    }
}
