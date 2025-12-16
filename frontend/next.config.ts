import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Aturan koneksi (Connect-src)
const connectSrc = isDev 
  ? "connect-src 'self' https: http://localhost:5000 http://localhost:3000 ws://localhost:3000;" 
  : "connect-src 'self' https: https://api.rylif-app.com;";

// Aturan gambar (Img-src)
const imgSrc = isDev
  ? "img-src 'self' data: blob: https: http://localhost:5000;" 
  : "img-src 'self' data: blob: https: https://api.rylif-app.com;";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "www.google.com" },
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/images/**" },
      { protocol: "https", hostname: "api.rylif-app.com", pathname: "/images/**" },
    ],
  },

  async headers() {
    // Kita buat string CSP yang bersih tanpa komentar '#' di dalamnya
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.gstatic.com;
      style-src 'self' 'unsafe-inline';
      font-src 'self' data: https:;
      object-src 'self' blob: data:;
      frame-src 'self' blob: data: https://accounts.google.com;
      worker-src 'self' blob:;
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
      ${imgSrc} 
      ${connectSrc}
    `;

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
            // .replace menghapus newline dan spasi berlebih menjadi satu baris
            value: cspHeader.replace(/\s{2,}/g, ' ').trim() 
          }
        ]
      }
    ]
  }
};

export default nextConfig;