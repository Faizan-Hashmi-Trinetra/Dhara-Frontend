import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'https://dhara-rag-2.onrender.com'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
