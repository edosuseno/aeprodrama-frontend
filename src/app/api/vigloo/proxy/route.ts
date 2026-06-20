import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendBase();
    // Reconstruct the exact same query parameters for the backend proxy
    const searchParams = request.nextUrl.search;
    const targetUrl = `${backendUrl}/vigloo/proxy${searchParams}`;

    const response = await fetch(targetUrl, {
      headers: {
        'x-forwarded-host': request.headers.get('host') || '',
        'x-forwarded-proto': request.headers.get('x-forwarded-proto') || 'http',
      },
      cache: 'no-store'
    });

    // Determine content type to correctly handle text (m3u8) vs binary (ts)
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const isText = contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('text');

    if (isText) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    } else {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }
  } catch (error: any) {
    console.error("Vigloo Proxy Error:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
