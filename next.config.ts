import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Square CDN hosts catalog item images — allow their domain
    remotePatterns: [
      {
        protocol: "https",
        hostname: "items-images-sandbox.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "items-images-sandbox.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "items-images.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.squarecdn.com",
      },
    ],
  },
};

export default nextConfig;
