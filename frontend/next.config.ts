import type { NextConfig } from "next";

// Deteksi apakah sedang mode development atau production
const isDev = process.env.NODE_ENV !== "production";

// Tentukan aturan koneksi berdasarkan mode
const connectSrc = isDev 
  ? "connect-src 'self' https: http://localhost:5000;" // Dev: Boleh localhost
  : "connect-src 'self' https:;";                      // Prod: HANYA HTTPS (Aman & Bersih)

// Tentukan aturan gambar (opsional, biar rapi juga)
const imgSrc = isDev
  ? "img-src 'self' data: https: blob: http://localhost:5000;" 
  : "img-src 'self' data: https: blob:;";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "www.google.com" },
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/images/**" },
      { protocol: "https", hostname: "api.rylif-app.com", pathname: "/images/**" },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            // Kita gabungkan variabel di atas ke dalam string CSP
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; style-src 'self' 'unsafe-inline'; font-src 'self' data: https:; ${imgSrc} ${connectSrc}`.replace(/\s{2,}/g, ' ').trim() 
          }
        ]
      }
    ]
  }
};

export default nextConfig;