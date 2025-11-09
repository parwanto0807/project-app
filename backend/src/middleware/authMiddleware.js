import jwt from "jsonwebtoken";
import cookie from "cookie";
import checkIfNewDevice from "../utils/cekNewDevices.js";

import { prisma } from "../config/db.js";
import { clearAuthCookies } from "../utils/setCookies.js";

import { JWT_SECRET, JWT_REFRESH_SECRET } from "../config/env.js";

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
    console.log("[AUTH] Starting token authentication for:", req.url);

    // ✅ DEBUG: Check JWT_SECRET sebelum digunakan
    console.log("[AUTH] JWT_SECRET configured:", JWT_SECRET ? "Yes" : "No");

    // Cek token dari multiple sources
    let token = null;

    // 1. Cek dari Authorization header
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      console.log("[AUTH] Token found in Authorization header");
    }

    // 2. Cek dari cookies (fallback)
    if (!token && req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
      console.log("[AUTH] Token found in cookies");
    }

    // 3. Cek dari query string (untuk development)
    if (!token && req.query && req.query.token) {
      token = req.query.token;
      console.log("[AUTH] Token found in query string");
    }

    if (!token) {
      console.log("[AUTH] No token provided");
      return res.status(401).json({
        success: false,
        error: "Access token required",
      });
    }

    console.log(`[AUTH] Token received: ${token.substring(0, 20)}...`);

    // ✅ Validasi JWT_SECRET
    if (!JWT_SECRET) {
      console.error("[AUTH] CRITICAL: JWT_SECRET is not defined");
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(
      `[AUTH] Token decoded for user: ${decoded.userId}, version: ${decoded.tokenVersion}`
    );

    // ✅ VALIDASI: Pastikan decoded.userId ada
    if (!decoded.userId) {
      console.error("[AUTH] Token missing userId");
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
      console.log(`[AUTH] User not found: ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    if (!user.active) {
      console.log(`[AUTH] Account deactivated: ${user.email}`);
      return res.status(401).json({
        success: false,
        error: "Account is deactivated",
      });
    }

    // ✅ PERBAIKAN: Check token version
    if (decoded.tokenVersion !== user.tokenVersion) {
      console.log(
        `[AUTH] Token version mismatch for user: ${user.email}. Token: ${decoded.tokenVersion}, DB: ${user.tokenVersion}`
      );

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

    console.log(`[AUTH] Authentication successful for user: ${user.email}`);

    // ✅ PERBAIKAN: Attach user ke request dengan data yang lengkap
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    // ✅ DEBUG: Log req.user untuk memastikan data ter-attach
    console.log(`[AUTH] req.user attached:`, req.user);

    next();
  } catch (error) {
    console.error("[AUTH] Middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      console.log("[AUTH] Invalid token format");
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      console.log("[AUTH] Token expired");
      return res.status(401).json({
        success: false,
        error: "Token expired",
      });
    }

    if (error.code === "MODULE_NOT_FOUND") {
      console.error("[AUTH] Module import error - check file paths");
      console.error("[AUTH] Error details:", error.message);
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
      });
    }

    console.error("[AUTH] Unexpected authentication error:", error.message);
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
      console.error("[AUTH] requireRole: req.user is missing");
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // ✅ VALIDASI: Pastikan req.user.id ada
    if (!req.user.id) {
      console.error("[AUTH] requireRole: req.user.id is undefined");
      return res.status(401).json({
        success: false,
        error: "Invalid user data",
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log(
        `[AUTH] Insufficient permissions for user: ${req.user.email}, role: ${req.user.role}, required: ${roles}`
      );
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

export {
  // authenticateToken,
  checkMFAStatus,
  verifySessionToken,
  authorizeAdmin,
  authorizeSuperAdmin,
  authorizeAdminOrSuper,
};
