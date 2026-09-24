import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: '/saved', destination: '/history', permanent: true }];
  },
};

export default nextConfig;
