import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite llamadas al backend FastAPI local en desarrollo
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination:
          process.env.NEXT_PUBLIC_BACKEND_URL
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/:path*`
            : "http://localhost:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
