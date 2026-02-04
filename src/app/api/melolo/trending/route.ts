import { type NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const baseUrl = getBackendBase();
    const response = await fetch(`${baseUrl}/melolo/trending`, { cache: 'no-store' });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Melolo Trending Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
