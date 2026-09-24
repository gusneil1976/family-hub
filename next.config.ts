import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1MB request body cap — too small for the
    // 5MB image uploads (meal photos, mini break files) this app allows.
    serverActions: {
      bodySizeLimit: "8mb",
    },
    // Keep recently visited pages in the browser so going back to them is
    // instant (any save still refreshes them via revalidatePath).
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
  // Only this app itself and Gus's Launcher (a local app on port 8120) may show it
  // inside a frame. Blocks other sites from framing it now that cookies are
  // SameSite=None (see src/lib/cookie-options.ts).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' http://localhost:8120 http://127.0.0.1:8120",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
