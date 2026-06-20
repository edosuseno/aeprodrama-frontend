import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const episodeIndex = searchParams.get('episodeIndex') || '1';
    
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    try {
        // Backend Radreels menggunakan parameter dramaId dan episodeId
        const response = await fetch(`${getBackendBase()}/radreels/stream?dramaId=${id}&episodeId=${episodeIndex}`, {
            cache: 'no-store'
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
