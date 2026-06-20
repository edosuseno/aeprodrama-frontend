import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const seasonId = searchParams.get("seasonId");
  const ep = searchParams.get("ep");

  try {
    const backendUrl = getBackendBase();
    let url = `${backendUrl}/vigloo/stream?id=${id}&seasonId=${seasonId}&ep=${ep}`;
    
    const response = await fetch(url, {
      cache: 'no-store'
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
