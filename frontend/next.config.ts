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
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/images/**",
      },
      {
        protocol: "http",
        hostname: "77.37.44.232",
        port: "5000",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
