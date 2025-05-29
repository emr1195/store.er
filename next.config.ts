import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export", // <--- esto habilita next export
  images: {
    unoptimized: true, // necesario para next export si usas imágenes
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  basePath: isProd ? "/store.er" : "",
  assetPrefix: isProd ? "/store.er/" : "",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
