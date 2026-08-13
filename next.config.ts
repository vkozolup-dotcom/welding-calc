import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow Cloudflare quick tunnels / local share hosts in `next dev`
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "italic-extraction-shareware-lawyer.trycloudflare.com",
  ],
};

export default nextConfig;
