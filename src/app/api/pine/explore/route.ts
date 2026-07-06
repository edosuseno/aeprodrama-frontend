import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    try {
        const backendUrl = getBackendBase();
        const res = await fetch(`${backendUrl}/pine/explore`, {
            cache: 'no-store'
        });
        const backendData = await res.json();
        const rawData = backendData.data || {};
        
        return NextResponse.json({
            success: true,
            data: rawData.dramas || [],
            hasMore: rawData.hasMore || false,
            total: rawData.dramas?.length || 0
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
