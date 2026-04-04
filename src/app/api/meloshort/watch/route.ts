import { NextRequest, NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const chapterId = searchParams.get("chapterId");

    if (!id || !chapterId) return NextResponse.json({ success: false, error: 'ID and chapterId required' }, { status: 400 });

    try {
        const res = await fetch(`${getBackendBase()}/meloshort/watch?id=${id}&chapterId=${chapterId}`, {
            cache: 'no-store'
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
