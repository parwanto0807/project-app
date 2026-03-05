// server.js - PRODUCTION READY VERSION for rylif-app.com
import { connectDB } from "./config/db.js";
import app from "./app.js";
import http from "http";
import { prisma } from "../src/config/db.js";
import { PORT as ENV_PORT, allowedOrigins } from "./config/env.js";
// import sessionCleanupJob from './config/sessionCleanUp.js';

// Helper function untuk parse cookies
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.trim().split("=");
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts.slice(1).join("=");
        cookies[key] = decodeURIComponent(value);
      }
    });
  }
  return cookies;
};

// 1️⃣ Buat HTTP server untuk Express
const server = http.createServer(app);

// Konfigurasi environment
const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || ENV_PORT;

// Domain configuration
const APP_DOMAIN = "rylif-app.com";
const APP_URL = isProduction
  ? `https://${APP_DOMAIN}`
  : "http://localhost:3000";
const API_URL = isProduction
  ? `https://api.${APP_DOMAIN}`
  : "http://localhost:5000";

console.log(`🌍 Environment: ${isProduction ? "Production" : "Development"}`);
console.log(`🌐 App URL: ${APP_URL}`);
console.log(`🔗 API URL: ${API_URL}`);

console.log("ℹ️  Real-time features are currently unavailable");
console.log("📡 REST API is fully operational");

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log("🔄 Starting graceful shutdown...");

  try {
    // Close HTTP server
    server.close(() => {
      console.log("✅ HTTP server closed");
    });

    // Close database connection
    await prisma.$disconnect();
    console.log("✅ Database disconnected");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// 7️⃣ Jalankan server
connectDB()
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`
🚀 Server is running!
✅ Environment: ${isProduction ? "Production" : "Development"}
✅ Port: ${PORT}
✅ Domain: ${APP_DOMAIN}
✅ CORS: Enabled for multiple origins
✅ REST API: Available on ${API_URL}
✅ Database: PostgreSQL with Prisma
ℹ️  Note: Real-time features are currently unavailable
      `);
    });
  })
  .catch((err) => {
    console.log("❌ Database connection failed:", err);
    process.exit(1);
  });
