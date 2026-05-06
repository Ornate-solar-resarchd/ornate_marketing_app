import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ornatesolar.com" },
      { protocol: "https", hostname: "www.solaredge.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "i.ibb.co" },
    ],
  },
  transpilePackages: ["@ornate/types"],
};

export default nextConfig;
