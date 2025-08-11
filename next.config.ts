import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Configurações para resolver problemas de prefetching
  async rewrites() {
    return [];
  },
};

export default nextConfig;
