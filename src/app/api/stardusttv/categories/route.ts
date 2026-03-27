import { getBackendBase } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendBase();
    // First, try to get categories from the backend
    const response = await fetch(`${backendUrl}/stardusttv/categories`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
    }
    
    return NextResponse.json({ success: false, error: "Failed to fetch from backend" }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
