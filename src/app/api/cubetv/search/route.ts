import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");
  const page = searchParams.get("page") || "1";

  try {
    const backendUrl = getBackendBase();
    const url = `${backendUrl}/cubetv/search?keyword=${encodeURIComponent(keyword || '')}&page=${page}`;
    
    const response = await fetch(url, {
      cache: 'no-store'
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
