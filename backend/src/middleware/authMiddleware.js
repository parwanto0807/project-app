import jwt from "jsonwebtoken";
import cookie from "cookie";
import checkIfNewDevice from "../utils/cekNewDevices.js";

import { prisma } from "../config/db.js";

import { JWT_SECRET } from "../config/env.js";

async function verifySessionToken(req, res, next) {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionToken = cookies.session_token;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Session token missing",
      });
    }

    // ✅ PERBAIKAN 1: Gunakan model yang sesuai
    const session = await prisma.userSession.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            name: true,
            tokenVersion: true,
          },
        },
      },
    });

    // ✅ PERBAIKAN 2: Validasi yang komprehensif
    if (!session) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Session not found",
      });
    }

    if (session.isRevoked) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Session revoked",
      });
    }

    if (new Date() > session.expiresAt) {
      // ✅ OPTIONAL: Auto-cleanup expired session
      await prisma.userSession.delete({
        where: { sessionToken },
      });

      return res.status(401).json({
        success: false,
        error: "Session expired - Please login again",
      });
    }

    // ✅ PERBAIKAN 3: Inject full user data untuk consistency
    req.user = session.user;

    // ✅ OPTIONAL: Tambahkan session info untuk audit
    req.session = {
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
    };

    next();
  } catch (err) {
    console.error("[verifySessionToken ERROR]", err);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
}

async function checkMFAStatus(req, res, next) {
  //  console.log("[MFA STATUS MIDDLEWARE 1]", req.user);

  // Handle both JWT token (userId) and session token (id)
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const deviceId = req.headers["x-device-id"] || req.ip;
  const isNewDevice = await checkIfNewDevice(userId, deviceId);

  //  console.log("[DeviceId]", deviceId);
  //  console.log("[IsNewDevice]", isNewDevice);

  // Ambil mfaEnabled dari DB!
  const userDb = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });

  req.mfaStatus = {
    required: isNewDevice && userDb?.mfaEnabled,
    enabled: userDb?.mfaEnabled,
  };
  //  console.log("[MFA STATUS MIDDLEWARE 2]", req.mfaStatus);
  next();
}

export const authenticateToken = async (req, res, next) => {
  try {
    // Cek token dari multiple sources
    let token = null;
    let tokenSource = "none";

    // 1. Cek dari Authorization header (PRIORITAS TERTINGGI)
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      tokenSource = "authorization_header";
    }

    // 2. ✅ PERBAIKAN: Cek dari SEMUA kemungkinan cookie names
    const possibleCookieNames = [
      "accessToken", // Standard name
      "accessTokenReadable", // Readable version
      "access_token", // Google/legacy name
      "token", // Alternative name
      "authToken", // Another alternative
    ];

    for (const cookieName of possibleCookieNames) {
      if (!token && req.cookies && req.cookies[cookieName]) {
        token = req.cookies[cookieName];
        tokenSource = `cookie_${cookieName}`;
        break; // Stop pada cookie pertama yang ditemukan
      }
    }

    // 3. Cek dari query string (untuk development)
    if (!token && req.query && req.query.token) {
      token = req.query.token;
      tokenSource = "query_string";
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
      });
    }

    // ✅ Validasi JWT_SECRET
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ VALIDASI: Pastikan decoded.userId ada
    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        error: "Invalid token: missing user information",
      });
    }

    // Check if user exists and token version matches
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        tokenVersion: true,
        active: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    if (!user.active) {
      return res.status(401).json({
        success: false,
        error: "Account is deactivated",
      });
    }

    // ✅ PERBAIKAN: Check token version
    if (decoded.tokenVersion !== user.tokenVersion) {
      // Import handleTokenVersionMismatch dynamically untuk avoid circular dependency
      const { handleTokenVersionMismatch } = await import(
        "../controllers/auth/authController.js"
      );

      // Auto-handle version mismatch
      await handleTokenVersionMismatch(user.id);

      return res.status(401).json({
        success: false,
        error: "Session expired. Please login again.",
      });
    }

    // ✅ PERBAIKAN: Attach user ke request dengan data yang lengkap
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (error) {
    console.error("[AUTH] Middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired",
      });
    }

    if (error.code === "MODULE_NOT_FOUND") {
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
};

// Middleware untuk roles tertentu
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // ✅ VALIDASI: Pastikan req.user.id ada
    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Invalid user data",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
    }

    next();
  };
};

function authorizeAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden - Admin only" });
  }
  next();
}

function authorizeSuperAdmin(req, res, next) {
  if (req.user?.role !== "super") {
    console.log("User at authorizeSuperAdmin:", req.user);
    return res.status(403).json({ message: "Forbidden - Super Admin only" });
  }
  next();
}

function authorizeAdminOrSuper(req, res, next) {
  // console.log("User at authorize:", req.user);
  if (req.user?.role === "admin" || req.user?.role === "super") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Forbidden - Admin or Super Admin only" });
}

// Middleware untuk update lastActiveAt tiap request
// src/middleware/authMiddleware.js - Perbaikan updateSessionActivity
export const updateSessionActivity = async (req, res, next) => {
  try {
    // Cari session ID dari berbagai sumber
    const sessionId =
      req.session?.id ||
      req.headers["x-session-id"] ||
      req.headers["session-id"] ||
      req.cookies?.sessionId;

    if (!sessionId || !req.user?.id) {
      console.log(`⚠️ [ACTIVITY] No valid session/user: ${sessionId}`);
      return next();
    }

    // Validasi format session ID (UUID harus 36 karakter)
    if (sessionId.length < 10 || sessionId.length > 100) {
      console.log(`⚠️ [ACTIVITY] Invalid session ID format: ${sessionId}`);
      return next();
    }

    console.log(
      `🔄 [ACTIVITY] Updating session: ${sessionId.substring(0, 8)}...`
    );

    // Update dengan error handling yang lebih baik
    const updatePromise = prisma.userSession.update({
      where: {
        id: sessionId,
        userId: req.user.id,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      data: {
        lastActiveAt: new Date(),
      },
    });

    // Gunakan timeout untuk mencegah blocking
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Update timeout")), 3000)
    );

    await Promise.race([updatePromise, timeoutPromise])
      .then(() => {
        // console.log(`✅ [ACTIVITY] Updated: ${sessionId.substring(0, 8)}`);
      })
      .catch((error) => {
        // Handle specific error cases
        if (error.code === "P2025") {
          console.log(
            `⚠️ [ACTIVITY] Session not found/revoked: ${sessionId.substring(
              0,
              8
            )}`
          );
        } else if (error.message === "Update timeout") {
          console.log(
            `⏰ [ACTIVITY] Timeout updating: ${sessionId.substring(0, 8)}`
          );
        } else {
          console.log(
            `❌ [ACTIVITY] Error updating ${sessionId.substring(0, 8)}:`,
            error.message
          );
        }
        // Don't throw, continue request
      });
  } catch (error) {
    console.error("[ACTIVITY] Unexpected error:", error.message);
  } finally {
    next(); // Always continue
  }
};

export {
  // authenticateToken,
  checkMFAStatus,
  verifySessionToken,
  authorizeAdmin,
  authorizeSuperAdmin,
  authorizeAdminOrSuper,
};
