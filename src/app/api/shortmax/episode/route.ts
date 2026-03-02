import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/shortmax";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const shortPlayId = searchParams.get("shortPlayId");
        const episodeNumber = searchParams.get("episodeNumber") || "1";

        if (!shortPlayId) {
            return NextResponse.json({ success: false, message: "shortPlayId is required" });
        }

        const response = await fetch(`${UPSTREAM_API}/episode?shortPlayId=${shortPlayId}&episodeNumber=${episodeNumber}`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({ success: false, message: "Fetch failed" });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("ShortMax Episode Error:", error);
        return NextResponse.json({ success: false, message: "Internal Error" });
    }
}
