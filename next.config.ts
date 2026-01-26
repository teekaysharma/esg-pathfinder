import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ['**/*'],
      };
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: [
    '*.replit.dev',
    '*.replit.app',
    '*.pike.replit.dev',
    '127.0.0.1',
  ],
};

export default nextConfig;
