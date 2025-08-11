import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Desabilitar prefetching para evitar ERR_ABORTED
 
  },
  // Configurações para resolver problemas de prefetching
  async rewrites() {
    return [];
  },
};

export default nextConfig;
