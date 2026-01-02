import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "app.yudi.co.in",
          },
        ],
        destination: "https://yudi.co.in/:path*",
        permanent: true, // 301 redirect
      },
    ];
  },
};

export default nextConfig;
