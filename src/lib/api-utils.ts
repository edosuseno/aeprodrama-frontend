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
  // Prioritaskan environment variable NEXT_PUBLIC_API_BASE_URL
  let base = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Jika di Vercel dan env kosong, coba gunakan URL sistem atau fallback aman
  if (!base) {
    base = "https://backend-gamma-eight-75.vercel.app";
  }

  // Pastikan selalu ada protokol agar tidak dianggap path relatif oleh browser
  if (!base.startsWith('http')) {
    base = `https://${base}`;
  }

  // Clean trailing slash
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }

  // Prevent double API segment (e.g., /api/api)
  if (base.endsWith('/api')) {
    return base;
  }

  // If base points to vercel but missing /api, append it
  if (base.includes('vercel.app')) {
    return `${base}/api`;
  }

  // Default behaviour: if it doesn't end in /api, append it
  if (!base.includes('/api')) {
    return `${base}/api`;
  }

  return base;
}

export function encryptedResponse(data: any, status = 200) {
  const encrypted = encryptData(data);
  return NextResponse.json({ success: true, data: encrypted }, { status });
}

/**
 * Memproksikan gambar melalui wsrv.nl untuk optimasi (WebP + Resize)
 * Membantu mempercepat loading poster di mobile
 */
export function getProxiedImage(url: string, width: number = 400) {
  if (!url) return "";
  if (url.includes("wsrv.nl") || url.includes("/api/proxy")) return url;
  
  // Bypass wsrv.nl untuk host yang diketahui menolak (akan memicu 400 Bad Request)
  if (url.startsWith("http://") || url.includes("montagehub.xyz") || url.includes("hikeuniverses.xyz") || url.includes("sansekai") || url.includes("fizzopic.org")) {
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  }
  
  // Gunakan wsrv.nl: output=webp untuk kompresi maksimal, w=width untuk resize
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp&q=80`;
}
