import type { NextConfig } from "next";

// Allow the Next/Vercel image optimizer to fetch + resize photos stored on
// Cloudflare R2. Without this, remote images can't be optimized and the
// browser downscales full-size (~1900px) files into tiny boxes, which looks
// pixelated. Hostname is derived from R2_PUBLIC_URL, with the r2.dev
// public-bucket pattern as a fallback.
const r2Host = (() => {
  try {
    return process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(r2Host ? [{ protocol: "https" as const, hostname: r2Host }] : []),
      { protocol: "https" as const, hostname: "*.r2.dev" },
    ],
  },
};

export default nextConfig;
