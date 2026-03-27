import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || searchParams.get('keyword');
    
    if (!query) return NextResponse.json({ success: true, data: [] });

    try {
        const response = await fetch(`${getBackendBase()}/velolo/search?query=${encodeURIComponent(query)}`, {
            cache: 'no-store'
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
