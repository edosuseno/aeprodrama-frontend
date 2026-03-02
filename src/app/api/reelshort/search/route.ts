import { safeJson, encryptedResponse, getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/reelshort";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const page = searchParams.get("page") || "1";

    if (!query) {
      return encryptedResponse({ success: true, data: [] });
    }

    const response = await fetch(
      `${UPSTREAM_API}/search?query=${encodeURIComponent(query)}&page=${page}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return encryptedResponse({ success: false, data: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("ReelShort Search Error:", error);
    return NextResponse.json({ success: false, data: [] });
  }
}

