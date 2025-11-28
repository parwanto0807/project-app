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
            name: true,
            email: true,
            role: true,
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

// src/controllers/auth/sessionController.js

export const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken, deviceInfo } = req.body;
    const userId = req.user.id; // Dari middleware auth

    console.log(`[FCM] Updating FCM token for user: ${userId}`);

    if (!fcmToken) {
      return res.status(400).json({ error: "FCM token diperlukan" });
    }

    // ✅ CARI BERDASARKAN userId + isRevoked (LEBIH ROBUST)
    const activeSession = await prisma.userSession.findFirst({
      where: {
        userId: userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(), // Session masih valid
        },
      },
      orderBy: {
        createdAt: "desc", // Ambil yang terbaru
      },
    });

    if (!activeSession) {
      console.log(`[FCM] Tidak ada session aktif untuk user: ${userId}`);
      return res.status(401).json({
        error: "Tidak ada session aktif",
        details: "Silakan login kembali",
      });
    }

    // ✅ UPDATE SESSION YANG AKTIF
    const updatedSession = await prisma.userSession.update({
      where: { id: activeSession.id },
      data: {
        fcmToken: fcmToken,
        deviceId: deviceInfo || activeSession.deviceInfo,
      },
    });

    console.log(`[FCM] FCM token updated for session: ${updatedSession.id}`);

    res.json({
      message: "FCM token berhasil diupdate",
      data: {
        sessionId: updatedSession.id,
        fcmToken: updatedSession.fcmToken,
      },
    });
  } catch (error) {
    console.error("❌ Error updateFcmToken:", error);
    res.status(500).json({
      error: "Gagal mengupdate FCM token",
      details: error.message,
    });
  }
};
