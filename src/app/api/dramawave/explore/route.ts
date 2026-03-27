import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const category = searchParams.get("category") || "popular";

  try {
    const backendUrl = getBackendBase();
    const response = await fetch(`${backendUrl}/dramawave/explore?page=${page}&category=${category}`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
    }
    
    return NextResponse.json({ success: false, error: "Failed to fetch from backend" }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
