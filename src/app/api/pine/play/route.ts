import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const ep = searchParams.get("ep");

    if (!id || !ep) {
        return NextResponse.json({ success: false, error: "ID and Episode are required" }, { status: 400 });
    }

    try {
        const backendUrl = getBackendBase();
        const res = await fetch(`${backendUrl}/pine/play?id=${id}&ep=${ep}`, {
            cache: 'no-store'
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
