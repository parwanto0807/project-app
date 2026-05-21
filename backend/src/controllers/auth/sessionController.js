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

export const getAllActiveSessionsForAdmin = async (req, res) => {
  try {
    // ⚠️ PENTING: Pastikan hanya Admin/Super Admin yang bisa akses
    // Jika middleware auth Anda belum mengecek role, lakukan manual di sini:
    if (req.user.role !== "admin" && req.user.role !== "super") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access reserved for administrators",
      });
    }

    // Ambil parameter pagination (Opsional tapi sangat disarankan untuk Admin)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filter Global: Hanya sesi yang aktif
    const activeFilter = {
      isRevoked: false,
      expiresAt: { gt: new Date() }, // Masih berlaku
    };

    // 1. Hitung Total Data (untuk pagination frontend)
    const totalCount = await prisma.userSession.count({
      where: activeFilter,
    });

    // 2. Ambil Data Sesi (Tanpa filter userId)
    const sessions = await prisma.userSession.findMany({
      where: activeFilter, // 👈 HANYA filter aktif/tidak, TANPA userId tertentu
      take: limit, // Batasi jumlah biar server gak berat
      skip: skip,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true, // Admin butuh tau role user ini apa
            image: true, // Opsional: foto profil
          },
        },
      },
      orderBy: { lastActiveAt: "desc" }, // Yang baru aktif muncul paling atas
    });

    // Format data
    const formattedSessions = sessions.map((session) =>
      formatSessionResponse(session)
    );

    res.json({
      success: true,
      data: formattedSessions,
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      message: "All active user sessions retrieved successfully",
    });
  } catch (error) {
    console.error("[ADMIN-SESSION] Error fetching all active sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch active sessions",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Ambil semua session untuk user yang sedang login
 * Optional query: ?activeOnly=true
 */
export const getAllSessions = async (req, res) => {
  try {
    // 🛡️ SECURITY CHECK: Karena filter userId dihapus, endpoint ini berbahaya
    // jika diakses user biasa. Pastikan hanya Admin/Super yang bisa akses.
    if (req.user.role !== "admin" && req.user.role !== "super") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access reserved for administrators",
      });
    }

    // 1. Filter Global: Tanpa userId, hanya sesi aktif
    const filter = {
      isRevoked: false, // Syarat 1: Tidak sedang dicabut/logout
      expiresAt: { gt: new Date() }, // Syarat 2: Token belum expired
    };

    // 2. Query ke Database
    const sessions = await prisma.userSession.findMany({
      where: filter, // 👈 Filter diterapkan disini
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            // image: true, // Opsional: jika butuh foto profil
          },
        },
      },
      orderBy: { lastActiveAt: "desc" }, // Urutkan dari yang paling baru aktif
    });

    // 3. Format response
    const formattedSessions = sessions.map((session) =>
      formatSessionResponse(session)
    );

    res.json({
      success: true,
      data: formattedSessions,
      count: formattedSessions.length,
      message: "All active user sessions retrieved successfully",
    });
  } catch (error) {
    console.error("[SESSION] Error in getAllActiveSessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch active sessions",
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

    (() => {})(`[FCM] User: ${userId.substring(0, 8)}`);

    const now = new Date();

    // Lakukan semua operasi yang berhubungan dengan revoke/create/update session secara atomik
    const txResult = await prisma.$transaction(async (tx) => {
      // Ambil session aktif
      let sessions = await tx.userSession.findMany({
        where: {
          userId: userId,
          isRevoked: false,
          expiresAt: { gt: now },
        },
        orderBy: { lastActiveAt: "desc" },
        select: { id: true, fcmToken: true, lastActiveAt: true, userAgent: true, ipAddress: true },
      });

      let revokedCount = 0;
      // Jika ada lebih dari 2, revoke yang paling lama sehingga tersisa 2
      if (sessions.length > 2) {
        const revokeSessions = sessions.slice(2);
        const updateRes = await tx.userSession.updateMany({
          where: { id: { in: revokeSessions.map((s) => s.id) } },
          data: { isRevoked: true, revokedAt: now, fcmToken: null },
        });
        revokedCount = updateRes.count || 0;
        // refresh sessions
        sessions = await tx.userSession.findMany({
          where: { userId: userId, isRevoked: false, expiresAt: { gt: now } },
          orderBy: { lastActiveAt: "desc" },
          select: { id: true, fcmToken: true, lastActiveAt: true, userAgent: true, ipAddress: true },
        });
      }

      // Tentukan target session (prioritas: currentSessionId, lalu yang terbaru)
      const currentSessionId = req.session?.id || req.headers["x-session-id"] || null;
      let target = null;
      if (currentSessionId) target = sessions.find((s) => s.id === currentSessionId) || null;
      if (!target && sessions.length > 0) target = sessions[0];

      // Jika tidak ada session aktif, buat baru
      if (!target) {
        target = await tx.userSession.create({
          data: {
            userId: userId,
            fcmToken: fcmToken,
            ipAddress: req.ip || "unknown",
            userAgent: req.headers["user-agent"] || "unknown",
            isRevoked: false,
            lastActiveAt: now,
            expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
          select: { id: true, fcmToken: true, lastActiveAt: true, userAgent: true, ipAddress: true },
        });
        // refresh sessions
        sessions = await tx.userSession.findMany({
          where: { userId: userId, isRevoked: false, expiresAt: { gt: now } },
          orderBy: { lastActiveAt: "desc" },
          select: { id: true, fcmToken: true, lastActiveAt: true, userAgent: true, ipAddress: true },
        });
      }

      // Cek duplikat token pada user lain (masih dalam transaction untuk konsistensi baca)
      const duplicate = await tx.userSession.findFirst({
        where: { fcmToken: fcmToken, userId: { not: userId }, isRevoked: false, expiresAt: { gt: now } },
        select: { id: true, userId: true },
      });

      // Update target session jika token berbeda, atau hanya perbarui lastActiveAt
      let didUpdate = false;
      let updatedSession = target;
      if (target.fcmToken !== fcmToken) {
        updatedSession = await tx.userSession.update({
          where: { id: target.id },
          data: { fcmToken: fcmToken, lastActiveAt: now },
          include: { user: { select: { id: true, name: true, email: true } } },
        });
        didUpdate = true;
      } else {
        await tx.userSession.update({ where: { id: target.id }, data: { lastActiveAt: now } });
      }

      // Ambil semua session untuk response/emit
      const allSessions = await tx.userSession.findMany({
        where: { userId: userId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { lastActiveAt: "desc" },
      });

      return { updatedSession, allSessions, revokedCount, didUpdate, duplicate };
    });

    // Gunakan hasil transaction untuk emit & response
    const { updatedSession, allSessions, revokedCount, didUpdate, duplicate } = txResult;

    if (duplicate) {
      (() => {})(`[FCM] ⚠️ Token used by another user: ${duplicate.userId.substring(0,8)}`);
    }

    // Emit update ke client (diluar transaction)
    if (req.io) {
      const formattedSessions = allSessions.map((s) => formatSessionResponse(s));
      req.io.to(`user:${userId}`).emit("session:updated", {
        type: "fcm_updated",
        sessions: formattedSessions,
        activeSessionId: updatedSession.id,
        timestamp: new Date().toISOString(),
      });
    }

    if (didUpdate) {
      return res.json({
        success: true,
        message: "FCM token updated (two-device policy)",
        data: {
          sessionId: updatedSession.id,
          device: updatedSession.userAgent,
          ip: updatedSession.ipAddress,
          updatedAt: new Date().toISOString(),
          previousSessionsRevoked: revokedCount,
        },
        policy: "two_device_per_account",
      });
    }

    return res.json({ success: true, message: "FCM token unchanged", unchanged: true });
  } catch (error) {
    console.error("[FCM] ❌ Error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to update FCM token",
      policy: "two_device_per_account",
    });
  }
};
