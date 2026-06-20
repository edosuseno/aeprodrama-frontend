import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    
    try {
        const response = await fetch(`${getBackendBase()}/flextv/explore?page=${page}`, {
            cache: 'no-store'
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
