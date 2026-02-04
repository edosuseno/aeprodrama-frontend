import { safeJson, encryptedResponse, getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/reelshort";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookId = searchParams.get("bookId");
    const episodeNumber = searchParams.get("episodeNumber");

    if (!bookId || !episodeNumber) {
      return NextResponse.json(
        { error: "bookId and episodeNumber are required" },
        { status: 400 }
      );
    }

    // Try /watch endpoint first (new standard)
    let response = await fetch(
      `${UPSTREAM_API}/watch?bookId=${encodeURIComponent(bookId)}&chapterId=${encodeURIComponent(episodeNumber)}`,
      { cache: 'no-store' }
    );

    // If failed, try legacy /episode endpoint
    if (!response.ok) {
      console.log("ReelShort watch endpoint failed, falling back to episode...");
      response = await fetch(
        `${UPSTREAM_API}/episode?bookId=${encodeURIComponent(bookId)}&episodeNumber=${encodeURIComponent(episodeNumber)}`,
        { cache: 'no-store' }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch episode" },
        { status: response.status }
      );
    }

    const data = await response.json();

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

