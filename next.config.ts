import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1MB request body cap — too small for the
    // 5MB image uploads (meal photos, mini break files) this app allows.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
