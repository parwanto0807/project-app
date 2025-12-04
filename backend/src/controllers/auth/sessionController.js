import { prisma } from "../../config/db.js";

/**
 * Helper function to extract device info from user agent
 */
function extractDeviceInfo(userAgent) {
  try {
    const ua = userAgent.toLowerCase();
    
    return {
      isMobile: ua.includes('mobile'),
      isTablet: ua.includes('tablet'),
      isDesktop: !ua.includes('mobile') && !ua.includes('tablet'),
      os: ua.includes('windows') ? 'Windows' : 
          ua.includes('mac os') ? 'macOS' : 
          ua.includes('linux') ? 'Linux' : 
          ua.includes('android') ? 'Android' : 
          (ua.includes('ios') || ua.includes('iphone')) ? 'iOS' : 'Unknown',
      browser: ua.includes('chrome') ? 'Chrome' : 
               ua.includes('firefox') ? 'Firefox' : 
               (ua.includes('safari') && !ua.includes('chrome')) ? 'Safari' : 
               ua.includes('edge') ? 'Edge' : 'Unknown',
    };
  } catch {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      os: 'Unknown',
      browser: 'Unknown',
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
    location: session.country ? {
      country: session.country,
      city: session.city,
    } : null,
    deviceInfo: extractDeviceInfo(session.userAgent),
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
    const formattedSessions = sessions.map(session => formatSessionResponse(session));

    res.json({
      success: true,
      data: formattedSessions,
      count: formattedSessions.length,
      activeCount: formattedSessions.filter(s => !s.isRevoked && new Date(s.expiresAt) > new Date()).length,
      message: 'Sessions retrieved successfully',
    });
  } catch (error) {
    console.error("[SESSION] Error in getAllSessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch sessions",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

    const formattedSessions = sessions.map(session => formatSessionResponse(session));

    res.json({
      success: true,
      data: formattedSessions,
      count: formattedSessions.length,
      message: 'Active sessions retrieved successfully',
    });
  } catch (error) {
    console.error("[SESSION] Error in getActiveSessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch active sessions",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

    const formattedSessions = allSessions.map(s => formatSessionResponse(s));

    // Emit socket update jika tersedia
    if (req.io) {
      req.io.to(`user:${userId}`).emit('session:updated', {
        type: 'session_revoked',
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
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to revoke session",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Revoke all other sessions except current one
 */
export const revokeAllOtherSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentSessionId = req.session?.id || req.headers['x-session-id'];

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

    const formattedSessions = allSessions.map(s => formatSessionResponse(s));

    // Emit socket update
    if (req.io) {
      req.io.to(`user:${userId}`).emit('session:updated', {
        type: 'revoked_all_others',
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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get current session (the one making this request)
 */
export const getCurrentSession = async (req, res) => {
  try {
    const sessionId = req.session?.id || req.headers['x-session-id'];
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
      message: 'Current session retrieved successfully',
    });
  } catch (error) {
    console.error("[SESSION] Error in getCurrentSession:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch current session",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Update FCM token untuk session saat ini
 */
export const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken, deviceInfo } = req.body;
    const userId = req.user.id;
    const sessionId = req.session?.id || req.headers['x-session-id'];

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        error: "FCM token is required",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID not found",
      });
    }

    // Pastikan session milik user yang benar
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId: userId,
        isRevoked: false,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Active session not found",
      });
    }

    // Update FCM token
    const updatedSession = await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        fcmToken: fcmToken,
        ...(deviceInfo && { deviceId: deviceInfo }),
        lastActiveAt: new Date(), // Update lastActiveAt juga
      },
    });

    // Cleanup FCM tokens dari revoked sessions
    await prisma.userSession.updateMany({
      where: {
        userId: userId,
        isRevoked: true,
        fcmToken: { not: null },
      },
      data: {
        fcmToken: null,
      },
    });

    // Ambil semua sessions untuk emit
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

    const formattedSessions = allSessions.map(s => formatSessionResponse(s));

    // Emit socket update jika ada perubahan
    if (req.io) {
      req.io.to(`user:${userId}`).emit('session:updated', {
        type: 'fcm_updated',
        sessions: formattedSessions,
        timestamp: new Date().toISOString(),
        updatedSessionId: sessionId,
      });
    }

    res.json({
      success: true,
      message: "FCM token updated successfully",
      data: {
        sessionId: updatedSession.id,
        fcmToken: updatedSession.fcmToken,
        updatedAt: new Date().toISOString(),
      },
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error("[SESSION] Error in updateFcmToken:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update FCM token",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};