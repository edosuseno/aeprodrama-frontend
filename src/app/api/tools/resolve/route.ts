import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    
    // Construct backend URL explicitly replacing any /api prefix to avoid double /api/api
    const base = getBackendBase().replace(/\/api$/, "");
    const backendUrl = `${base}/api/tools/resolve?${searchParams.toString()}`;
    
    try {
        const backendRes = await fetch(backendUrl, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            }
        });

        if (!backendRes.ok) {
            return NextResponse.json({ error: `Backend returned ${backendRes.status}` }, { status: backendRes.status });
        }

        const data = await backendRes.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in tools/resolve proxy:", error);
        return NextResponse.json({ error: "Failed to connect to backend" }, { status: 500 });
    }
}
