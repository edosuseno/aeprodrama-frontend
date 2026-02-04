import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get("keyword") || searchParams.get("query");

    if (!keyword) {
      return NextResponse.json({ error: "Keyword parameter is required" }, { status: 400 });
    }

    const res = await fetch(`${getBackendBase()}/freereels/searchBook?keyword=${encodeURIComponent(keyword)}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("FreeReels search Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
