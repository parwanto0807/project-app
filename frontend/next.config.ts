import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        // pathname: "/**", // opsional, biarkan semua path
      },
      {
        protocol: "https",
        hostname: "www.google.com",
        // pathname: "/images/**", // opsional, biarkan semua path di folder tertentu
      },
    ],
  },
};

export default nextConfig;
