import { type NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    const baseUrl = getBackendBase();
    const response = await fetch(`${baseUrl}/melolo/stream?videoId=${videoId}`, { cache: 'no-store' });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Melolo stream:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
