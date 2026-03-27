import { safeJson, getBackendBase } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || searchParams.get("bookId");
  const episodeIndex = searchParams.get("episodeIndex") || searchParams.get("chapterIndex") || "1";
  
  if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
  }

  const UPSTREAM_API = `${getBackendBase()}/dramabox2/watch?bookId=${id}&episodeIndex=${episodeIndex}`;

  try {
    const response = await fetch(UPSTREAM_API, {
      cache: 'no-store',
    });

    if (!response.ok) {
        return NextResponse.json({ success: false }, { status: response.status });
    }

    const data = await safeJson(response);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error (Dramabox2 Watch):", error);
    return NextResponse.json(
      { error: "Internal Server Error", success: false },
      { status: 500 }
    );
  }
}
