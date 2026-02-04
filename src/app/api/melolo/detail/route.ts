import { type NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookId = searchParams.get("bookId");

  if (!bookId) {
    return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
  }

  try {
    const baseUrl = getBackendBase();
    const response = await fetch(`${baseUrl}/melolo/detail?bookId=${bookId}`, { cache: 'no-store' });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Melolo detail:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
