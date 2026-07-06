import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("bookId") || searchParams.get("id");
    const episodeIndex = searchParams.get("episodeIndex") || "1";

    try {
        const res = await fetch(`${getBackendBase()}/goodshort/stream?bookId=${id}&episodeIndex=${episodeIndex}`, {
            cache: 'no-store'
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
