import { NextRequest, NextResponse } from "next/server";

// Use your actual backend URL
const BACKEND_BASE = "https://aeprodrama-backend.vercel.app/api";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get("source");
    const bookId = searchParams.get("bookId");
    const chapterId = searchParams.get("chapterId") || searchParams.get("videoId");
    const ep = searchParams.get("ep");

    if (!source || !bookId) {
        return new NextResponse("Missing params", { status: 400 });
    }

    try {
        // Forward to your REAL Backend Express resolver
        const backendUrl = `${BACKEND_BASE}/tools/resolve?source=${source}&bookId=${bookId}&chapterId=${chapterId}&ep=${ep}`;
        console.log(`[Resolver] Forwarding to Backend: ${backendUrl}`);

        return NextResponse.redirect(backendUrl, 302);
    } catch (error: any) {
        console.error("Resolver Error:", error);
        return new NextResponse("Internal Error: " + error.message, { status: 500 });
    }
}
