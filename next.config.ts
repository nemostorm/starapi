import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["webpack"],
    // Force Webpack in dev
    forceWebPack: true,
  },
};

export default nextConfig;
