import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/shortmax";

export async function GET(request: NextRequest) {
    try {
        const query = request.nextUrl.searchParams.get("query");

        if (!query) {
            return NextResponse.json({ success: false, message: "Query is required" });
        }

        const response = await fetch(`${UPSTREAM_API}/search?query=${encodeURIComponent(query)}`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({ success: false, data: [] });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("ShortMax Search Error:", error);
        return NextResponse.json({ success: false, data: [] });
    }
}
