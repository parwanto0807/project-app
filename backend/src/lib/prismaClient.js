import { PrismaClient } from "../../prisma/generated/prisma/index.js";

const globalForPrisma = globalThis;
export const prisma =
  globalForPrisma.__prisma || new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
