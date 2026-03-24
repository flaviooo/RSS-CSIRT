import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  logging: {
    fetches: {
      hmrRefreshes: false,
    },
  },
  allowedDevOrigins: ['controllo1.csea.local'],
};

export default nextConfig;
