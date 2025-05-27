import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  eslint: {
    // Ignorar errores de ESLint durante el build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Ignorar errores de TypeScript durante el build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
