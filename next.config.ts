import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    qualities: [60, 75],
    imageSizes: [32, 36, 40, 48, 64, 72, 80, 96, 128],
    minimumCacheTTL: 604800,
  },
}

export default nextConfig;
