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
  let base = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api";

  // Remove trailing slash
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }

  // If the base URL is pointing to our own Vercel backend and missing /api, add it
  // This handles https://aeprodrama-backend.vercel.app -> https://aeprodrama-backend.vercel.app/api
  if (base.includes('vercel.app') && !base.includes('/api')) {
    return `${base}/api`;
  }

  return base;
}

export function encryptedResponse(data: any, status = 200) {
  const encrypted = encryptData(data);
  return NextResponse.json({ success: true, data: encrypted }, { status });
}
