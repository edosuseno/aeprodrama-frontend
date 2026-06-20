import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const pathname = url.pathname; // e.g. /api/idrama2/explore
    const searchString = url.search; // e.g. ?page=1

    // Extract everything after /api/idrama2/
    const targetPath = pathname.replace('/api/idrama2/', '');

    const backendUrl = getBackendBase();
    const targetUrl = `${backendUrl}/idrama2/${targetPath}${searchString}`;
    
    const response = await fetch(targetUrl, {
      cache: 'no-store'
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
