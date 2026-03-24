import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  logging: {
    fetches: {
      hmrRefreshes: false,
    },
  },
};

export default nextConfig;
