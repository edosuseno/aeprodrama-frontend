import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", 
      },
      {
        protocol: "https",
        hostname: "gkcnbnlfqdlotnjaizxx.supabase.co",
      }
    ],
  },
  devIndicators: {
    // buildActivity: false, // Deprecated in Next.js 15+
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Rewrite dihapus karena konflik dengan API route handlers di src/app/api/
  // API routes sudah proxy ke http://localhost:5001/api secara langsung.
};

export default nextConfig;
// Force route reload: 2026-03-28 19:17
