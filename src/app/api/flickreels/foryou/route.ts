import { getBackendBase } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(`${getBackendBase()}/flickreels/foryou`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
