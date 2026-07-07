import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shortPlayId = searchParams.get("shortPlayId");

  if (!shortPlayId) {
    return NextResponse.json({ success: false, error: "Missing shortPlayId" }, { status: 400 });
  }

  try {
    const backendUrl = getBackendBase();
    // Concept derived from stardusttv proxy but mapped to shortwave2 upstream
    const response = await fetch(`${backendUrl}/shortwave2/detail?shortPlayId=${shortPlayId}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
        return NextResponse.json({ success: false, error: `Upstream returned ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Shortwave2 Proxy Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
