import { encryptedResponse, safeJson, getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return encryptedResponse({ status_code: 0, msg: "ID param required" }, 400);
  }

  try {
    const res = await fetch(`${getBackendBase()}/flickreels/detail?id=${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        return encryptedResponse({ status_code: 404, msg: "Drama not found" }, 404);
      }
      throw new Error(`Upstream API failed with status: ${res.status}`);
    }

    const data = await safeJson(res);
    return encryptedResponse(data);
  } catch (error) {
    console.error("Error fetching FlickReels detail:", error);
    return encryptedResponse(
      { status_code: 0, msg: "Internal Server Error" },
      500
    );
  }
}
