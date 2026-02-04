import { NextRequest, NextResponse } from "next/server";
import { encryptedResponse, safeJson, getBackendBase } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json({ error: "Keyword parameter is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${getBackendBase()}/flickreels/search?keyword=${encodeURIComponent(keyword)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      throw new Error(`Upstream API failed with status ${res.status}`);
    }

    const data = await safeJson(res);
    return await encryptedResponse(data);
  } catch (error) {
    console.error("Error fetching FlickReels search:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
