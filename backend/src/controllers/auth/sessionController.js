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
    const userId = req.user.id;
    const sessionToken = req.cookies.session_token;

    if (!fcmToken) {
      return res.status(400).json({
        error: "FCM token diperlukan",
      });
    }

    console.log(`[FCM] Updating FCM token for user: ${userId}`);

    // Cari session yang aktif berdasarkan session_token
    const existingSession = await prisma.userSession.findFirst({
      where: {
        userId: userId,
        sessionToken: sessionToken,
        isRevoked: false,
      },
    });
    console.log(`[FCM] existingSession: ${existingSession}`);

    if (!existingSession) {
      console.log(
        `[FCM] Session tidak ditemukan, membuat session baru untuk user: ${userId}`
      );

      // Buat session baru jika tidak ditemukan
      const newSession = await prisma.userSession.create({
        data: {
          userId: userId,
          sessionToken: sessionToken,
          fcmToken: fcmToken,
          deviceId: deviceInfo || "Unknown Device",
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent") || "Unknown",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 hari
          isActive: true,
        },
      });

      return res.json({
        data: {
          sessionId: newSession.id,
          fcmToken: newSession.fcmToken,
        },
      });
    }

    // Update session yang existing
    const updatedSession = await prisma.userSession.update({
      where: {
        id: existingSession.id,
      },
      data: {
        fcmToken: fcmToken,
        deviceId: deviceInfo || existingSession.deviceInfo,
      },
    });

    console.log(
      `[FCM] FCM token berhasil diupdate untuk session: ${updatedSession.id}`
    );

    res.json({
      message: "FCM token berhasil diupdate",
      data: {
        sessionId: updatedSession.id,
        fcmToken: updatedSession.fcmToken,
      },
    });
  } catch (error) {
    console.error("❌ Error updateFcmToken:", error);

    // Handle error specific untuk record not found
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Session tidak ditemukan",
        details: "Session mungkin sudah expired atau dihapus",
      });
    }

    res.status(500).json({
      error: "Gagal mengupdate FCM token",
      details: error.message,
    });
  }
};
