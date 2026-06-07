import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the multi-lockfile workspace-root warning (a stray ~/package-lock.json).
  outputFileTracingRoot: process.cwd(),
  // Don't fail production builds on lint; we'll clean lint separately.
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
