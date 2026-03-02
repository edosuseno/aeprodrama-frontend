import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/netshort";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || searchParams.get("keyword");

    if (!query) {
      return NextResponse.json({ success: false, data: [] });
    }

    const response = await fetch(`${UPSTREAM_API}/search?keyword=${encodeURIComponent(query)}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, data: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("NetShort Search Error:", error);
    return NextResponse.json({ success: false, data: [] });
  }
}
