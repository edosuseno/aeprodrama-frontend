import { safeJson, getBackendBase } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const episodeIndex = searchParams.get("episodeIndex") || "1";
  
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const UPSTREAM_API = `${getBackendBase()}/dotdrama/watch?id=${id}&episodeIndex=${episodeIndex}`;

  try {
    const response = await fetch(UPSTREAM_API, {
      cache: 'no-store',
    });

    if (!response.ok) {
        return NextResponse.json({ success: false, data: null }, { status: response.status });
    }

    const data = await safeJson(response);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error (DotDrama Watch):", error);
    return NextResponse.json(
      { error: "Internal Server Error", success: false, data: null },
      { status: 500 }
    );
  }
}
