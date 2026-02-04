import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const urlStr = request.nextUrl.searchParams.get("url");
    if (!urlStr) return new NextResponse("Missing URL", { status: 400 });

    try {
        const targetUrl = new URL(urlStr);
        const requestHeaders = new Headers();

        // Forward critical headers
        requestHeaders.set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1");
        requestHeaders.set("Referer", "https://www.dramabox.com/");
        requestHeaders.set("Origin", "https://www.dramabox.com/");

        // Forward Range header if present
        const range = request.headers.get("range");
        if (range) {
            requestHeaders.set("Range", range);
        }

        // Fetch content
        const response = await fetch(urlStr, {
            headers: requestHeaders,
            redirect: 'follow'
        });

        // Don't error immediately on 4xx/5xx, pass it through so client sees it
        // if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

        const contentType = response.headers.get("Content-Type") || "";

        // JIKA M3U8: Rewrite isinya agar segmen .ts juga lewat proxy ini
        if (urlStr.includes(".m3u8") || contentType.includes("mpegurl") || contentType.includes("hls")) {
            let text = await response.text();

            // Rewrite URL absolute (http...) ke proxy
            text = text.replace(/(https?:\/\/[^\s]+)/g, (match) => {
                return `/api/proxy?url=${encodeURIComponent(match)}`;
            });

            // Rewrite URL relative (tidak diawali #) ke proxy (dengan base URL)
            // Base URL from urlStr
            const baseUrl = urlStr.substring(0, urlStr.lastIndexOf('/') + 1);

            text = text.replace(/^(?!#)(?!(http|\/api\/proxy)).+$/gm, (match) => {
                // Resolve relative URL
                try {
                    // Clean match
                    const cleanMatch = match.trim();
                    const absolute = new URL(cleanMatch, baseUrl).toString();
                    return `/api/proxy?url=${encodeURIComponent(absolute)}`;
                } catch (e) { return match; }
            });

            return new NextResponse(text, {
                headers: {
                    "Content-Type": "application/vnd.apple.mpegurl",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-cache"
                }
            });
        }

        // JIKA BUKAN M3U8 (MP4/TS): Stream langsung dengan support Range
        const responseHeaders = new Headers();
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        if (contentType) responseHeaders.set("Content-Type", contentType);

        // Forward Content-Range etc for seeking
        if (response.headers.get("Content-Length")) responseHeaders.set("Content-Length", response.headers.get("Content-Length")!);
        if (response.headers.get("Content-Range")) responseHeaders.set("Content-Range", response.headers.get("Content-Range")!);
        if (response.headers.get("Accept-Ranges")) responseHeaders.set("Accept-Ranges", response.headers.get("Accept-Ranges")!);

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });

    } catch (error: any) {
        console.error("Proxy Error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
