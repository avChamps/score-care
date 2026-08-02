import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  allowedDevOrigins: ["192.168.0.5"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
