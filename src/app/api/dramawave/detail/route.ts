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
    const response = await fetch(`${backendUrl}/dramawave/detail?shortPlayId=${shortPlayId}`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
    }
    
    return NextResponse.json({ success: false, error: "Failed to fetch detail" }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
