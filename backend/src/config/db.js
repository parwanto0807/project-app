import { PrismaClient } from "../../prisma/generated/prisma/index.js";

// simpan di globalThis biar tidak dobel saat hot-reload
const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: ["error", "warn"], // opsional
  });
}

const prisma = globalForPrisma.prisma;

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL database");
  } catch (err) {
    console.error("Failed to connect to PostgreSQL database", err);
    process.exit(1);
  }
}

export { prisma };
