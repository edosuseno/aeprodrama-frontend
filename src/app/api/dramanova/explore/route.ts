import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const category = searchParams.get("category") || "all";

  try {
    const backendUrl = getBackendBase();
    const url = `${backendUrl}/dramanova/explore?page=${page}&category=${category}`;
    
    const response = await fetch(url, {
      cache: 'no-store'
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
