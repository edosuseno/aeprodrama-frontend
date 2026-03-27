import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response('URL missing', { status: 400 });
  }

  try {
    const backendUrl = getBackendBase();
    const response = await fetch(`${backendUrl}/dramawave/proxy?url=${encodeURIComponent(url)}`);
    
    // Forward the response body and headers
    const data = response.body;
    const headers = new Headers(response.headers);
    
    // Ensure CORS is allowed for the player
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(data, {
      status: response.status,
      headers: headers
    });
  } catch (error) {
    return new Response('Proxy Error', { status: 500 });
  }
}
