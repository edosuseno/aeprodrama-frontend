import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shortPlayId = searchParams.get("shortPlayId");
  const episodeNo = searchParams.get("episodeNo");

  try {
    let backendUrl = getBackendBase();
    if (!backendUrl || backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      backendUrl = process.env.BACKEND_URL || 'https://backend-gamma-eight-75.vercel.app/api';
    }
    let url = `${backendUrl}/shortsky/stream?shortPlayId=${shortPlayId}&episodeNo=${episodeNo}`;
    
    const response = await fetch(url, {
      cache: 'no-store'
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
