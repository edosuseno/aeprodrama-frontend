import { safeJson, encryptedResponse, getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

// FORCE Backend URL to ensure we hit our proxy, not Sansekai direct
const UPSTREAM_API = "https://aeprodrama-backend.vercel.app/api/reelshort";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookId = searchParams.get("bookId");
    const episodeNumber = searchParams.get("episodeNumber");

    console.log(`📡 [Frontend API] Fetching ReelShort Watch: bookId=${bookId}, ep=${episodeNumber}`);
    console.log(`🔗 [Frontend API] Connecting to Upstream: ${UPSTREAM_API}`);

    if (!bookId || !episodeNumber) {
      return NextResponse.json(
        { error: "bookId and episodeNumber are required" },
        { status: 400 }
      );
    }

    // Try /watch endpoint first
    const watchUrl = `${UPSTREAM_API}/watch?bookId=${encodeURIComponent(bookId)}&chapterId=${encodeURIComponent(episodeNumber)}`;
    console.log(`▶️ [Frontend API] Try Watch URL: ${watchUrl}`);

    let response = await fetch(watchUrl, { cache: 'no-store' });

    // If failed, try legacy /episode endpoint
    if (!response.ok) {
      console.log("⚠️ [Frontend API] Watch endpoint failed, trying fallback /episode...");
      const epUrl = `${UPSTREAM_API}/episode?bookId=${encodeURIComponent(bookId)}&episodeNumber=${encodeURIComponent(episodeNumber)}`;
      response = await fetch(epUrl, { cache: 'no-store' });
    }

    if (!response.ok) {
      console.error(`❌ [Frontend API] Upstream failed with status: ${response.status}`);
      const text = await response.text();
      console.error(`❌ [Frontend API] Upstream error body: ${text}`);

      return NextResponse.json(
        { error: "Failed to fetch episode from upstream" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ [Frontend API] Upstream success. Data keys: ${Object.keys(data).join(', ')}`);

    // Backend returns encrypted data, pass it through
    return NextResponse.json(data);
  } catch (error) {
    console.error("ReelShort Episode Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

