import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("keyword");

    if (!query) return NextResponse.json({ success: true, data: [] });

    try {
        const res = await fetch(`${getBackendBase()}/meloshort/search?query=${encodeURIComponent(query)}`, {
            cache: 'no-store'
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
