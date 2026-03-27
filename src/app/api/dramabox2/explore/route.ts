import { safeJson, getBackendBase } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  
  const UPSTREAM_API = `${getBackendBase()}/dramabox2/explore?page=${page}`;

  try {
    const response = await fetch(UPSTREAM_API, {
      cache: 'no-store',
    });

    if (!response.ok) {
        // Fallback or empty if backend fails
        return NextResponse.json({ success: false, data: [] }, { status: response.status });
    }

    const data = await safeJson(response);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error (Dramabox2 Explore):", error);
    return NextResponse.json(
      { error: "Internal Server Error", success: false, data: [] },
      { status: 500 }
    );
  }
}
