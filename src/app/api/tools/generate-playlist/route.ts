import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

// Use your actual backend URL
const BACKEND_BASE = getBackendBase();

export async function POST(request: NextRequest) {
    try {
        const { source, bookId } = await request.json();

        if (!source || !bookId) {
            return NextResponse.json({ error: "Missing source or bookId" }, { status: 400 });
        }

        const host = request.headers.get("host") || "aepro.my.id";
        const protocol = request.headers.get("x-forwarded-proto") || "https";
        const baseUrl = `${protocol}://${host}`;

        // Forward the request to your REAL Backend Express
        const backendUrl = `${BACKEND_BASE}/tools/generate-playlist`;
        console.log(`[Downloader] Calling Backend: ${backendUrl}`);

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source,
                bookId,
                baseUrl // We send frontend base URL so backend can generic correct links
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend Error: ${errorText}`);
        }

        const m3uContent = await response.text();
        const title = `${source}-${bookId}`;

        return new NextResponse(m3uContent, {
            headers: {
                "Content-Type": "application/x-mpegurl",
                "Content-Disposition": `attachment; filename="${title}.m3u8"`
            }
        });

    } catch (error: any) {
        console.error("Generate Playlist Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
