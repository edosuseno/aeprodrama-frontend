import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api") + "/dramabox";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();

  // FIX: Sansekai API expects /detail?bookId=XYZ, not /detail/XYZ
  const url = `${BACKEND_URL}/detail?bookId=${bookId}${queryString ? `&${queryString}` : ""}`;

  console.log(`🌐 [Frontend Proxy] Proxying detail to: ${url}`);

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch from backend" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Frontend Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
