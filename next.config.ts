import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // <- necesario para generar sitio estático
  images: {
    unoptimized: true, // necesario si usas <Image />
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  basePath: "",
  assetPrefix: "",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
