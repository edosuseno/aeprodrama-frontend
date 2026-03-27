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
    const response = await fetch(`${backendUrl}/stardusttv/detail?shortPlayId=${shortPlayId}`, {
      cache: 'no-store'
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
