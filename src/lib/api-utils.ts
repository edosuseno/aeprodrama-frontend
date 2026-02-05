import { NextResponse } from "next/server";
import { encryptData } from "@/lib/crypto";

export async function safeJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text || !text.trim()) {
    throw new Error(`Empty response from upstream: ${response.url}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("JSON Parse Error:", error);
    console.error("Raw Text (truncated):", text.substring(0, 200));
    throw new Error("Invalid JSON response from upstream");
  }
}

export function getBackendBase() {
  // 1. DEVELOPMENT: Auto-detect localhost (Local Backend)
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_BASE_URL) {
    return "http://localhost:5001/api";
  }

  // 2. PRODUCTION / EXPLICIT OVERRIDE
  let base = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api";

  // Clean trailing slash
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }

  // Prevent double API segment (e.g., /api/api)
  // If base already ends with /api, return it as is
  if (base.endsWith('/api')) {
    return base;
  }

  // If base points to vercel but missing /api, append it
  if (base.includes('vercel.app')) {
    return `${base}/api`;
  }

  // Default behaviour: if it doesn't end in /api, append it? 
  // Safety: usually base url is just the domain.
  if (!base.includes('/api')) {
    return `${base}/api`;
  }

  return base;
}

export function encryptedResponse(data: any, status = 200) {
  const encrypted = encryptData(data);
  return NextResponse.json({ success: true, data: encrypted }, { status });
}
