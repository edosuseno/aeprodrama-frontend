import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const urlStr = request.nextUrl.searchParams.get("url");
    if (!urlStr) return new NextResponse("Missing URL", { status: 400 });

    try {
        const targetUrl = new URL(urlStr);
        const requestHeaders = new Headers();

        // Forward critical headers
        // Tentukan Referer yang tepat berdasarkan domain tujuan
        let referer = "https://www.dramabox.com/";
        let origin = "https://www.dramabox.com";

        if (urlStr.includes('shortmax') || urlStr.includes('akamai') || urlStr.includes('shortttv')) {
            referer = "https://www.shortmax.com/";
            origin = "https://www.shortmax.com";
        } else if (urlStr.includes('flickreels') || urlStr.includes('farsunpteltd') || urlStr.includes('playlet-hls')) {
            referer = "https://www.flickreels.com/";
            origin = "https://www.flickreels.com";
        }

        requestHeaders.set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1");
        requestHeaders.set("Referer", referer);
        requestHeaders.set("Origin", origin);

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
            
            // Base URL and Query Params from root manifest
            const baseUrl = urlStr.substring(0, urlStr.lastIndexOf('/') + 1);
            const parentUrlObj = new URL(urlStr);
            const parentUrlSearchParams = parentUrlObj.searchParams;

            const proxyRewrite = (uri: string) => {
                let cleanUri = uri.replace(/^["'](.*)["']$/, '$1');
                let absoluteUrl = cleanUri;
                
                if (!cleanUri.startsWith('http')) {
                    try {
                        const urlObj = new URL(cleanUri, baseUrl);
                        // Security Passthrough: Copy tokens if missing
                        if (urlObj.search === '') {
                            parentUrlSearchParams.forEach((value, key) => {
                                urlObj.searchParams.set(key, value);
                            });
                        }
                        absoluteUrl = urlObj.toString();
                    } catch (e) { return uri; }
                }
                return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
            };

            // Rewrite segments
            text = text.split('\n').map(line => {
                let trimmed = line.trim();
                if (!trimmed) return line;
                if (!trimmed.startsWith('#')) return proxyRewrite(trimmed);
                if (trimmed.includes('URI=')) {
                    return trimmed.replace(/URI=(['"]?)(.*?)\1/g, (match, quote, uri) => {
                        return `URI="${proxyRewrite(uri)}"`;
                    });
                }
                return line;
            }).join('\n');

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
        
        // Ensure status 206 for range requests
        const status = response.status === 200 && range ? 206 : response.status;

        // Forward Content-Range etc for seeking
        if (response.headers.get("Content-Length")) responseHeaders.set("Content-Length", response.headers.get("Content-Length")!);
        if (response.headers.get("Content-Range")) responseHeaders.set("Content-Range", response.headers.get("Content-Range")!);
        if (response.headers.get("Accept-Ranges")) responseHeaders.set("Accept-Ranges", response.headers.get("Accept-Ranges")!);
        
        return new NextResponse(response.body, {
            status: status,
            statusText: response.statusText,
            headers: responseHeaders
        });


    } catch (error: any) {
        console.error("Proxy Error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
