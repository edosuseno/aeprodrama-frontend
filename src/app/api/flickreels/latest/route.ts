import { encryptedResponse, safeJson, getBackendBase } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(`${getBackendBase()}/flickreels/latest`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    const data = await safeJson(res);
    return encryptedResponse(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
