// /config/env.js
import "dotenv/config";

const clean = (v) => (v ?? "").trim().replace(/^['"]|['"]$/g, ""); // trim + buang kutip di awal/akhir
const required = (key) => {
  const val = clean(process.env[key]);
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
};

const devOrigins = ["http://localhost:3000"];
const prodOrigins = [
  "https://rylif-app.com",
  "https://www.rylif-app.com",
  "https://app.rylif-app.com",
  "https://admin.rylif-app.com",
  "https://api.rylif-app.com",
];

export const NODE_ENV = clean(process.env.NODE_ENV) || "development";
export const PORT = clean(process.env.PORT) || 5000;

export const JWT_SECRET = required("JWT_SECRET");
export const JWT_REFRESH_SECRET = required("JWT_REFRESH_SECRET");

export const DATABASE_URL = clean(process.env.DATABASE_URL);
export const GOOGLE_CLIENT_ID = clean(process.env.GOOGLE_CLIENT_ID);
export const GOOGLE_FLUTTER_CLIENT_ID = clean(process.env.GOOGLE_FLUTTER_CLIENT_ID);
export const GOOGLE_CLIENT_SECRET = clean(process.env.GOOGLE_CLIENT_SECRET);
export const GOOGLE_CALLBACK_URL =
  clean(process.env.GOOGLE_CALLBACK_URL) ||
  "http://localhost:5000/api/auth/google/callback";
export const SESSION_SECRET = clean(process.env.SESSION_SECRET);
export const CLIENT_URL = clean(process.env.CLIENT_URL);
export const MFA_TEMP_SECRET = clean(process.env.MFA_TEMP_SECRET);

// 🔎 Debug aman di dev: tampilkan panjang, bukan nilainya
if (NODE_ENV !== "production") {
  if (JWT_SECRET === JWT_REFRESH_SECRET) {
    console.warn(
      "[ENV] WARNING: JWT_SECRET dan JWT_REFRESH_SECRET sebaiknya BERBEDA."
    );
  }
}
export const allowedOrigins = NODE_ENV === "production" ? prodOrigins : devOrigins;

// Di development, Next.js otomatis pindah port (3001, 3002, ...) bila port
// sebelumnya sudah dipakai. Izinkan semua origin localhost di dev agar CORS
// tidak menolak frontend yang berjalan di port selain 3000.
const isLocalDevOrigin = (origin) => {
  if (NODE_ENV === "production") return false;
  try {
    const { protocol, hostname } = new URL(origin);
    return (
      protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(hostname)
    );
  } catch {
    return false;
  }
};

export const isAllowedOrigin = (origin) => {
  if (!origin) return true; // request tanpa Origin (mobile / server-to-server)
  return allowedOrigins.includes(origin) || isLocalDevOrigin(origin);
};

  ;(() => {})(NODE_ENV);
  ;(() => {})(allowedOrigins);
