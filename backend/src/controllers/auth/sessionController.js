import { prisma } from "../../config/db.js";

/**
 * Helper function to extract device info from user agent
 */
function extractDeviceInfo(userAgent) {
  try {
    const ua = userAgent.toLowerCase();

    return {
      isMobile: ua.includes("mobile"),
      isTablet: ua.includes("tablet"),
      isDesktop: !ua.includes("mobile") && !ua.includes("tablet"),
      os: ua.includes("windows")
        ? "Windows"
        : ua.includes("mac os")
        ? "macOS"
        : ua.includes("linux")
        ? "Linux"
        : ua.includes("android")
        ? "Android"
        : ua.includes("ios") || ua.includes("iphone")
        ? "iOS"
        : "Unknown",
      browser: ua.includes("chrome")
        ? "Chrome"
        : ua.includes("firefox")
        ? "Firefox"
        : ua.includes("safari") && !ua.includes("chrome")
        ? "Safari"
        : ua.includes("edge")
        ? "Edge"
        : "Unknown",
    };
  } catch {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      os: "Unknown",
      browser: "Unknown",
    };
  }
}

/**
 * Format session response untuk frontend
 */
function formatSessionResponse(session) {
  const formatted = {
    id: session.id,
    user: {
      id: session.user?.id,
      name: session.user?.name,
      email: session.user?.email,
      role: session.user?.role,
    },
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    isRevoked: session.isRevoked,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    lastActiveAt: session.lastActiveAt
      ? session.lastActiveAt.toISOString()
      : session.createdAt.toISOString(),
    revokedAt: session.revokedAt ? session.revokedAt.toISOString() : null,
    fcmToken: session.fcmToken,
    origin: session.origin,
    country: session.country,
    city: session.city,
    deviceId: session.deviceId,
    location: session.country
      ? {
          country: session.country,
          city: session.city,
        }
      : null,
    deviceId: extractDeviceInfo(session.userAgent),
  };

  return formatted;
}

/**
 * Ambil semua session untuk user yang sedang login
 * Optional query: ?activeOnly=true
 */
export const getAllSessions = async (req, res) => {
  try {
    const { activeOnly = "false" } = req.query;
    const userId = req.user.id;

    // Filter berdasarkan activeOnly
    const filter = {
      userId: userId,
      ...(activeOnly === "true" && {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      }),
    };

    const sessions = await prisma.userSession.findMany({
      where: filter,
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
      orderBy: { lastActiveAt: "desc" }, // Urutkan berdasarkan lastActiveAt
    });

    // Format response untuk frontend
    const formattedSessions = sessions.map((session) =>
      formatSessionResponse(session)
    );

    res.json({
      success: true,
      data: formattedSessions,
      count: formattedSessions.length,
      activeCount: formattedSessions.filter(
        (s) => !s.isRevoked && new Date(s.expiresAt) > new Date()
      ).length,
      message: "Sessions retrieved successfully",
    });
  } catch (error) {
    console.error("[SESSION] Error in getAllSessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch sessions",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Ambil semua sesi aktif (tidak expired & tidak revoked) untuk user yang sedang login
 */
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await prisma.userSession.findMany({
      where: {
        userId: userId,
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
      orderBy: { lastActiveAt: "desc" },
    });

    const formattedSessions = sessions.map((session) =>
      formatSessionResponse(session)
    );

    res.json({
      success: true,
      data: formattedSessions,
      count: formattedSessions.length,
      message: "Active sessions retrieved successfully",
    });
  } catch (error) {
    console.error("[SESSION] Error in getActiveSessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch active sessions",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Revoke session tertentu (logout paksa)
 * Hanya bisa revoke session milik sendiri
 */
export const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Pastikan session yang akan di-revoke milik user yang sedang login
    const session = await prisma.userSession.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found or unauthorized",
      });
    }

    if (session.isRevoked) {
      return res.status(400).json({
        success: false,
        error: "Session already revoked",
      });
    }

    const currentSessionId = req.session?.id;
    if (session.id === currentSessionId) {
      return res.status(400).json({
        success: false,
        error: "Cannot revoke current session",
      });
    }

    // Update session menjadi revoked
    const updated = await prisma.userSession.update({
      where: { id: id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        fcmToken: null, // Clear FCM token saat revoke
      },
    });

    // Ambil semua sessions terbaru untuk emit socket
    const allSessions = await prisma.userSession.findMany({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { lastActiveAt: "desc" },
    });

    const formattedSessions = allSessions.map((s) => formatSessionResponse(s));

    // Emit socket update jika tersedia
    if (req.io) {
      req.io.to(`user:${userId}`).emit("session:updated", {
        type: "session_revoked",
        sessions: formattedSessions,
        timestamp: new Date().toISOString(),
        revokedSessionId: id,
      });
    }

    res.json({
      success: true,
      message: "Session revoked successfully",
      data: {
        id: updated.id,
        revokedAt: updated.revokedAt.toISOString(),
      },
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error("[SESSION] Error in revokeSession:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to revoke session",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Revoke all other sessions except current one
 */
export const revokeAllOtherSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentSessionId = req.session?.id || req.headers["x-session-id"];

    if (!currentSessionId) {
      return res.status(400).json({
        success: false,
        error: "Current session ID not found",
      });
    }

    // Revoke semua session kecuali yang sedang aktif
    const result = await prisma.userSession.updateMany({
      where: {
        userId: userId,
        isRevoked: false,
        id: { not: currentSessionId },
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        fcmToken: null,
      },
    });

    // Ambil semua sessions terbaru
    const allSessions = await prisma.userSession.findMany({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { lastActiveAt: "desc" },
    });

    const formattedSessions = allSessions.map((s) => formatSessionResponse(s));

    // Emit socket update
    if (req.io) {
      req.io.to(`user:${userId}`).emit("session:updated", {
        type: "revoked_all_others",
        sessions: formattedSessions,
        timestamp: new Date().toISOString(),
        revokedCount: result.count,
      });
    }

    res.json({
      success: true,
      message: `Successfully revoked ${result.count} other sessions`,
      data: {
        revokedCount: result.count,
        sessions: formattedSessions,
      },
    });
  } catch (error) {
    console.error("[SESSION] Error in revokeAllOtherSessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to revoke other sessions",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get current session (the one making this request)
 */
export const getCurrentSession = async (req, res) => {
  try {
    const sessionId = req.session?.id || req.headers["x-session-id"];
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID not found",
      });
    }

    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId: userId,
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
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Current session not found or expired",
      });
    }

    const formattedSession = formatSessionResponse(session);
    formattedSession.isCurrent = true;

    res.json({
      success: true,
      data: formattedSession,
      message: "Current session retrieved successfully",
    });
  } catch (error) {
    console.error("[SESSION] Error in getCurrentSession:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch current session",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Update FCM token untuk session saat ini
 */
export const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    // 1. VALIDASI KETAT
    if (!fcmToken || typeof fcmToken !== "string" || fcmToken.length < 10) {
      return res.status(400).json({
        success: false,
        error: "Valid FCM token required",
      });
    }

    console.log(`[FCM-1DEVICE] User: ${userId.substring(0, 8)}`);

    // 2. CARI SESSION UNTUK USER INI
    const userSessions = await prisma.userSession.findMany({
      where: {
        userId: userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true,
        fcmToken: true,
        lastActiveAt: true,
        userAgent: true,
        ipAddress: true,
      },
    });

    // 3. ENFORCE: HANYA 1 SESSION AKTIF
    if (userSessions.length > 1) {
      console.log(
        `[FCM-1DEVICE] ⚠️ ${userSessions.length} active sessions found`
      );

      // REVOKE SEMUA KECUALI YANG TERBARU
      const keepSession = userSessions[0]; // Paling baru
      const revokeSessions = userSessions.slice(1);

      await prisma.userSession.updateMany({
        where: {
          id: { in: revokeSessions.map((s) => s.id) },
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          fcmToken: null, // Clear token dari session yang direvoke
        },
      });

      console.log(
        `[FCM-1DEVICE] 🔒 Revoked ${revokeSessions.length} old sessions`
      );
    }

    // 4. TENTUKAN TARGET SESSION
    let targetSession = userSessions[0]; // Gunakan yang terbaru

    // Jika tidak ada session aktif, buat baru
    if (!targetSession || userSessions.length === 0) {
      console.log(`[FCM-1DEVICE] 📝 Creating new session for 1-device user`);

      targetSession = await prisma.userSession.create({
        data: {
          userId: userId,
          fcmToken: fcmToken,
          ipAddress: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          isRevoked: false,
          lastActiveAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 hari
        },
        select: {
          id: true,
          fcmToken: true,
          lastActiveAt: true,
          userAgent: true,
          ipAddress: true,
        },
      });
    }

    // 5. CEK DUPLIKAT FCM TOKEN DI USER LAIN
    const duplicateTokenInOtherUsers = await prisma.userSession.findFirst({
      where: {
        fcmToken: fcmToken,
        userId: { not: userId }, // User lain
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    });

    if (duplicateTokenInOtherUsers) {
      console.log(
        `[FCM-1DEVICE] ⚠️ Token used by another user: ${duplicateTokenInOtherUsers.userId.substring(
          0,
          8
        )}`
      );

      // Clear token dari user lain (jika policy mengizinkan)
      // await prisma.userSession.updateMany({
      //   where: {
      //     fcmToken: fcmToken,
      //     userId: { not: userId },
      //   },
      //   data: { fcmToken: null },
      // });
    }

    // 6. UPDATE FCM TOKEN (hanya jika berbeda)
    if (targetSession.fcmToken !== fcmToken) {
      console.log(`[FCM-1DEVICE] 🔄 Updating FCM token`);

      const updatedSession = await prisma.userSession.update({
        where: { id: targetSession.id },
        data: {
          fcmToken: fcmToken,
          lastActiveAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // 7. GET ALL SESSIONS (setelah update)
      const allSessions = await prisma.userSession.findMany({
        where: { userId: userId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { lastActiveAt: "desc" },
      });

      // 8. EMIT UPDATE KE CLIENT
      if (req.io) {
        const formattedSessions = allSessions.map((s) =>
          formatSessionResponse(s)
        );
        req.io.to(`user:${userId}`).emit("session:updated", {
          type: "fcm_updated_1device",
          sessions: formattedSessions,
          activeSessionId: targetSession.id,
          timestamp: new Date().toISOString(),
        });
      }

      // 9. RESPONSE
      return res.json({
        success: true,
        message: "FCM token updated (1 device policy)",
        data: {
          sessionId: targetSession.id,
          device: targetSession.userAgent,
          ip: targetSession.ipAddress,
          updatedAt: new Date().toISOString(),
          previousSessionsRevoked:
            userSessions.length > 1 ? userSessions.length - 1 : 0,
        },
        policy: "one_device_per_account",
      });
    } else {
      // Token sama, hanya update lastActiveAt
      await prisma.userSession.update({
        where: { id: targetSession.id },
        data: { lastActiveAt: new Date() },
      });

      return res.json({
        success: true,
        message: "FCM token unchanged",
        unchanged: true,
      });
    }
  } catch (error) {
    console.error("[FCM-1DEVICE] ❌ Error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to update FCM token",
      policy: "one_device_per_account",
    });
  }
};
