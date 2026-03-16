import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ornatesolar.com" },
      { protocol: "https", hostname: "www.solaredge.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
    ],
  },
  transpilePackages: ["@ornate/types"],
};

export default nextConfig;
