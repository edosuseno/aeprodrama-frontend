import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/shortmax";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const shortPlayId = searchParams.get("shortPlayId");

        if (!shortPlayId) {
            return NextResponse.json({ success: false, message: "shortPlayId is required" });
        }

        const response = await fetch(`${UPSTREAM_API}/detail?shortPlayId=${shortPlayId}`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({ success: false, message: "Fetch failed" });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("ShortMax Detail Error:", error);
        return NextResponse.json({ success: false, message: "Internal Error" });
    }
}
