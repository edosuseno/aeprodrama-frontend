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
        hostname: "imgcdnmi.dramaboxdb.com",
      },
      {
        protocol: "https",
        hostname: "hwztchapter.dramaboxdb.com",
      },
      {
        protocol: "https",
        hostname: "awscover.netshort.com",
      },
      {
        protocol: "https",
        hostname: "static.netshort.com",
      },
      {
        protocol: "https",
        hostname: "cover.netshort.com",
      },
      {
        protocol: "https",
        hostname: "alicdn.netshort.com",
      },
      {
        protocol: "https",
        hostname: "zshipubcdn.farsunpteltd.com",
      },
      {
        protocol: "https",
        hostname: "zshipricf.farsunpteltd.com",
      },
      // MovieBox Domains
      {
        protocol: "https",
        hostname: "pbcdnw.aoneroom.com",
      },
      {
        protocol: "https",
        hostname: "h5.aoneroom.com",
      },
      // Image Proxy
      {
        protocol: "https",
        hostname: "wsrv.nl",
      },
      // TMDB (MovieBox)
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      // ReelShort & Common CDNs
      {
        protocol: "https",
        hostname: "d25m7s2b2j6k0q.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.reelshort.com",
      },
    ],
  },
  // MEMATIKAN TOMBOL "N" (Dev Indicator)
  // MEMATIKAN TOMBOL "N" (Dev Indicator) - Removed deprecated buildActivity
  devIndicators: {
    // buildActivity: false, // Deprecated in Next.js 15+
  },
  typescript: {
    ignoreBuildErrors: true,
  },

};

export default nextConfig;
