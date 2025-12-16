import type { NextConfig } from "next";

// Deteksi mode development vs production
const isDev = process.env.NODE_ENV !== "production";

// Aturan koneksi (Connect-src)
const connectSrc = isDev 
  ? "connect-src 'self' https: http://localhost:5000;" 
  : "connect-src 'self' https:;";

// Aturan gambar (Img-src)
const imgSrc = isDev
  ? "img-src 'self' data: https: blob: http://localhost:5000;" 
  : "img-src 'self' data: https: blob:;";

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
            // PERUBAHAN ADA DI SINI:
            // 1. Menambahkan "object-src 'none';" (Sangat penting untuk keamanan)
            // 2. Menambahkan "base-uri 'self';" (Mencegah pembajakan base tag)
            // 3. Menambahkan "form-action 'self';" (Mencegah form dikirim ke web lain)
            value: `
              default-src 'self'; 
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; 
              style-src 'self' 'unsafe-inline'; 
              font-src 'self' data: https:; 
              object-src 'none'; 
              base-uri 'self'; 
              form-action 'self'; 
              frame-ancestors 'none'; 
              block-all-mixed-content; 
              upgrade-insecure-requests; 
              ${imgSrc} ${connectSrc}
            `.replace(/\s{2,}/g, ' ').trim() 
          }
        ]
      }
    ]
  }
};

export default nextConfig;