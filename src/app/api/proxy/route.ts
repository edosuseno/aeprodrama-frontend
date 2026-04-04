import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const urlStr = request.nextUrl.searchParams.get("url");
    if (!urlStr) return new NextResponse("Missing URL", { status: 400 });

    try {
        const targetUrl = new URL(urlStr);
        const requestHeaders = new Headers();

        // Forward critical headers
        let referer = "https://www.google.com/";
        let origin = "";

        if (urlStr.includes('dramabox')) {
            referer = "https://www.dramabox.com/";
            origin = "https://www.dramabox.com";
        } else if (urlStr.includes('shortmax') || urlStr.includes('akamai') || urlStr.includes('shortttv')) {
            referer = "https://www.shortmax.com/";
            origin = "https://www.shortmax.com";
        } else if (urlStr.includes('flickreels') || urlStr.includes('farsunpteltd') || urlStr.includes('playlet-hls')) {
            referer = "https://www.flickreels.com/";
            origin = "https://www.flickreels.com";
        } else if (urlStr.includes('melolo') || urlStr.includes('velolo') || urlStr.includes('dramawave')) {
            referer = "https://vidrama.asia/";
            origin = "https://vidrama.asia";
        } else if (urlStr.includes('jobsamg') || urlStr.includes('dnk7') || urlStr.includes('sansekai')) {
            referer = "https://www.dramanova.com/";
            origin = "https://www.dramanova.com";
        } else {
            // Generic fallback: use the domain of the target URL as referer
            try {
                referer = `${targetUrl.protocol}//${targetUrl.host}/`;
            } catch (e) {}
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

            // Rewrite segments and keys
            text = text.split('\n').map(line => {
                const trimmed = line.trim();
                if (!trimmed) return line;

                const proxyRewrite = (uri: string) => {
                    let cleanUri = uri.replace(/^["'](.*)["']$/, '$1');
                    let absoluteUrl = cleanUri;
                    
                    if (!cleanUri.startsWith('http')) {
                        try {
                            const urlObj = new URL(cleanUri, baseUrl);
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

                // Jika baris adalah tag yang mengandung URI (X-KEY, X-MAP, dll)
                if (trimmed.startsWith('#') && trimmed.includes('URI=')) {
                    return trimmed.replace(/URI=(['"]?)(.*?)\1/g, (m, quote, uri) => {
                        return `URI="${proxyRewrite(uri)}"`;
                    });
                }
                
                // Jika baris adalah URL segmen (tidak dimulai dengan #)
                if (!trimmed.startsWith('#')) {
                    return proxyRewrite(trimmed);
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

        // JIKA SUBTITLE (SRT/VTT): Convert ke VTT (Wajib untuk Chrome)
        const isSubtitle = urlStr.includes(".srt") || urlStr.includes(".vtt") || urlStr.includes("mime_type=text_plain") || urlStr.includes("hikeuniverses.xyz") ||
                         contentType.includes("subrip") || contentType.includes("text/vtt") ||
                         (contentType.includes("application/octet-stream") && (urlStr.toLowerCase().endsWith(".srt") || urlStr.toLowerCase().endsWith(".vtt")));

        if (isSubtitle && response.ok) {
            let content = await response.text();
            // Bersihkan BOM
            content = content.replace(/^\ufeff/, '').trim();
            
            let vttContent = content;
            if (!content.startsWith('WEBVTT')) {
                // Konversi SRT ke VTT: Ganti koma ke titik pada timestamp
                vttContent = 'WEBVTT\n\n' + content
                    .replace(/(\d{1,2}:\d{2}:\d{2}),(\d{2,3})/g, '$1.$2');
            } else {
                // Pastikan format timestamp konsisten (titik)
                vttContent = content.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{2,3})/g, '$1.$2');
            }

            return new NextResponse(vttContent, {
                headers: {
                    "Content-Type": "text/vtt; charset=utf-8",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Cache-Control": "public, max-age=3600"
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
