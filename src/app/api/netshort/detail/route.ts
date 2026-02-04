import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/netshort";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shortPlayId = searchParams.get("shortPlayId");

    if (!shortPlayId) {
      return NextResponse.json({ success: false, error: "shortPlayId is required" }, { status: 400 });
    }

    const response = await fetch(`${UPSTREAM_API}/allepisode?shortPlayId=${shortPlayId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch from backend" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("NetShort Detail Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
