import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/netshort";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";

    const response = await fetch(`${UPSTREAM_API}/foryou?page=${page}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, data: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("NetShort ForYou Error:", error);
    return NextResponse.json({ success: false, data: [] });
  }
}
