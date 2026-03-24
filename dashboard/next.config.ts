import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  logging: {
    fetches: {
      hmrRefreshes: false,
    },
  },
  devServer: {
    allowedDevOrigins: ['http://controllo1.csea.local'], // Sostituisci con il tuo dominio o origine
  },
};

export default nextConfig;
