import { safeJson, encryptedResponse, getBackendBase } from "@/lib/api-utils";
import { NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/reelshort";

export async function GET() {
  try {
    const response = await fetch(`${UPSTREAM_API}/homepage`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("ReelShort API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

