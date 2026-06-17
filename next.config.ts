import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // ── Performance optimizations ────────────────────────────────────────────
  // Compress all responses with gzip + brotli (huge win on mobile 3G/4G).
  compress: true,

  // Smaller, faster production builds.
  productionBrowserSourceMaps: false,

  // Ignore TS errors during build (pre-existing — keep existing behavior).
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,

  // Strip console.log/error in production (keep warnings).
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // Long-term caching headers for static assets (immutable — filenames are hashed).
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/icon-192.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800",
          },
        ],
      },
      {
        source: "/icon-512.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
