import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/moviebox";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const episodeId = searchParams.get("episodeId") || "";

        const response = await fetch(`${UPSTREAM_API}/sources?id=${id}&episodeId=${episodeId}`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Upstream Error" }, { status: response.status });
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
