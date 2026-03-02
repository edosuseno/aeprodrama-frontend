import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ status_code: 0, msg: "ID param required" }, { status: 400 });
    }

    const response = await fetch(`${getBackendBase()}/flickreels/detail?id=${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ status_code: 0, msg: "Failed" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("FlickReels Detail Error:", error);
    return NextResponse.json({ status_code: 0, msg: "Internal Error" }, { status: 500 });
  }
}
