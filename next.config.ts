
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true,
    dynamicIO: true,
  },
};

export default nextConfig;
