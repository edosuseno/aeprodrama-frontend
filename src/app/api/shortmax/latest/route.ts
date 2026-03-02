import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/shortmax";

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${UPSTREAM_API}/latest`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({ success: false, data: [] });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("ShortMax Latest Error:", error);
        return NextResponse.json({ success: false, data: [] });
    }
}
