import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  eslint: {
    // ✅ Opción 3: Ignora los errores de ESLint en el build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;