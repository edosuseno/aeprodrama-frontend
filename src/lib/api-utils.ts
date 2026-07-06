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
  // Prioritaskan environment variable NEXT_PUBLIC_API_BASE_URL
  let base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (base) base = base.replace(/['"]/g, '');

  // Jika di browser, terapkan logika dinamis
  if (typeof window !== 'undefined') {
    // Jika origin adalah production (bukan localhost) tapi env-nya localhost, abaikan env tersebut
    if (base && base.includes('localhost') && window.location.hostname !== 'localhost') {
      base = '';
    }
    
    // Jika base kosong, gunakan origin saat ini (relatif)
    if (!base) {
      return `${window.location.origin}/api`;
    }
  }

  // Fallback terakhir: berjalan di sisi server (Node.js API route)
  if (!base) {
    base = "http://localhost:5001";
  }

  // Pastikan selalu ada protokol agar tidak dianggap path relatif oleh browser
  if (!base.startsWith('http')) {
    base = `http://${base}`;
  }

  // Clean trailing slash
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }

  // Prevent double API segment (e.g., /api/api)
  if (base.endsWith('/api')) {
    return base;
  }

  // Default behaviour: append /api
  return `${base}/api`;
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
  if (url.startsWith("http://") || url.includes("montagehub.xyz") || url.includes("hikeuniverses.xyz") || url.includes("sansekai") || url.includes("tiktokcdn.com")) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  
  // Gunakan wsrv.nl: output=webp untuk kompresi maksimal, w=width untuk resize
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp&q=80`;
}
