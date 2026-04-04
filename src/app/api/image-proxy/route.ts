import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const urlStr = request.nextUrl.searchParams.get("url");
    if (!urlStr) return new NextResponse("Missing URL", { status: 400 });

    try {
        const decodedUrl = decodeURIComponent(urlStr);
        
        // Headers untuk bypass proteksi hotlinking
        const headers: Record<string, string> = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        };

        // Logika Referer Khusus
        if (decodedUrl.includes('stardusttv.cc')) {
            // Stardust seringkali memblokir jika referer salah atau ada referer non-stardust
            headers["Referer"] = ""; 
        } else if (decodedUrl.includes('flickreels') || decodedUrl.includes('farsunpteltd')) {
            headers["Referer"] = "https://www.flickreels.com/";
        } else if (decodedUrl.includes('montagehub.xyz') || decodedUrl.includes('jobsamg')) {
            headers["Referer"] = "https://www.dramanova.com/";
        } else {
            headers["Referer"] = "https://www.google.com/";
        }

        const response = await fetch(decodedUrl, {
            headers,
            next: { revalidate: 86400 } // Cache di level Next.js selama 24 jam
        });

        // Teruskan status error dari upstream jika bukan 2xx (misal 404 dari sumbernya)
        if (!response.ok) {
            console.error(`Upstream image error ${response.status}: ${decodedUrl}`);
            // Jika 404 dari sumber, kirim placeholder atau teruskan 404
        }

        const contentType = response.headers.get("Content-Type") || "image/jpeg";
        const imageBuffer = await response.arrayBuffer();

        return new NextResponse(imageBuffer, {
            status: response.status,
            headers: {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
            }
        });
    } catch (error: any) {
        console.error("Image Proxy Error:", error.message);
        return new NextResponse(null, { status: 500 });
    }
}
