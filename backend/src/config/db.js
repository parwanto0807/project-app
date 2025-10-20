import { PrismaClient } from "../../prisma/generated/prisma/index.js";

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: ["error", "warn"], // bisa tambahkan "query" untuk debug
  });
}

const prisma = globalForPrisma.prisma;

// === Middleware Audit Log ===
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  // Hindari recursive log untuk model AuditLog sendiri
  if (
    params.model !== "AuditLog" &&
    ["create", "update", "delete"].includes(params.action)
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          model: params.model,
          action: params.action,
          durationMs: after - before,
          data: JSON.stringify(params.args), // simpan args yang dikirim
          before: null, // opsional, bisa diisi nanti untuk update
          after: result ? JSON.stringify(result) : null,
          userId: global.currentUserId || "system",
          createdAt: new Date(),
        },
      });
    } catch (err) {
      console.error("Audit log gagal disimpan:", err);
    }
  }

  return result;
});

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
