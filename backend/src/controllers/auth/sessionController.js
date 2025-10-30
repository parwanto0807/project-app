import { prisma } from "../../config/db.js";

/**
 * Ambil semua session (optional filter)
 * contoh usage:
 *  /sessions?activeOnly=true
 */
export const getAllSessions = async (req, res) => {
  try {
    const { activeOnly = "false" } = req.query;

    const filter =
      activeOnly === "true"
        ? {
            isRevoked: false,
            expiresAt: { gt: new Date() },
          }
        : {};

    const sessions = await prisma.userSession.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true, // opsional sesuai schema kamu
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(sessions);
  } catch (error) {
    console.error("[getAllSessions] Error:", error);
    res.status(500).json({ message: "Gagal mengambil data session" });
  }
};

/**
 * Ambil semua sesi aktif (tidak expired & tidak revoked)
 */
export const getActiveSessions = async (req, res) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            namaLengkap: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(sessions);
  } catch (error) {
    console.error("[getActiveSessions] Error:", error);
    res.status(500).json({ message: "Gagal mengambil data session aktif" });
  }
};

/**
 * Revoke session tertentu (logout paksa)
 */
export const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await prisma.userSession.update({
      where: { id },
      data: { isRevoked: true },
    });

    res.json({ message: "Session berhasil direvoke", session: updated });
  } catch (error) {
    console.error("[revokeSession] Error:", error);
    res.status(500).json({ message: "Gagal merevoke session" });
  }
};
