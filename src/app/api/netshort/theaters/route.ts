import { getBackendBase } from "@/lib/api-utils";
import { NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/netshort";

export async function GET() {
  try {
    const response = await fetch(`${UPSTREAM_API}/theaters`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, data: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("NetShort Theaters Error:", error);
    return NextResponse.json({ success: false, data: [] });
  }
}
