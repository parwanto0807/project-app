// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import { prisma } from "../../config/db.js";

import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { setTokenCookies } from "../../utils/setCookies.js";
import { clearAuthCookies } from "../../utils/setCookies.js";
import { COOKIE_NAMES } from "../../config/cookies.js";

// Asumsi file env.js mengekspor variabel-variabel ini
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  MFA_TEMP_SECRET,
} from "../../config/env.js";
import { io } from "../../server.js";

// Constants untuk konsistensi
const TOKEN_CONFIG = {
  access: { expiresIn: "8h" },
  refresh: { expiresIn: "7d" },
  mfa: { expiresIn: "5m" },
};

const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

// ✅ PERBAIKAN: Token generation yang konsisten
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id, // ✅ Untuk kompatibilitas backend lama
      id: user.id, // ✅ Untuk konsistensi
      role: user.role,
      email: user.email,
      tokenVersion: user.tokenVersion || 0,
    },
    JWT_SECRET,
    TOKEN_CONFIG.access
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      tokenVersion: user.tokenVersion || 0,
      type: "refresh",
    },
    JWT_REFRESH_SECRET,
    TOKEN_CONFIG.refresh
  );
};

async function createUserSession(user, req) {
  console.log("🔄 [SESSION] Creating session for user:", user.id);

  try {
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";

    const userAgent = req.headers["user-agent"] || "Unknown";
    const origin = req.headers["origin"] || null;
    const deviceId = req.headers["x-device-id"] || req.body?.deviceId || null;

    // ✅ Validasi
    if (!user?.id) {
      throw new Error("Invalid user data for session creation");
    }

    console.log(
      `👤 User ${user.id.substring(
        0,
        8
      )} | IP: ${ipAddress} | Device: ${userAgent?.substring(0, 50)}`
    );

    // ✅ SEMUA DALAM 1 TRANSACTION (ATOMIC)
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // ✅ 1. CLEANUP: Delete VERY old sessions (>30 hari) dan expired
      const deletedSessions = await tx.userSession.deleteMany({
        where: {
          userId: user.id,
          OR: [
            {
              createdAt: {
                lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
              },
            }, // >30 hari
            { expiresAt: { lt: now } }, // Expired
          ],
        },
      });

      // console.log(`🗑️ Deleted ${deletedSessions.count} old/expired sessions`);

      // ✅ 2. ENFORCE 1 SESSION: Revoke ALL other active sessions FIRST
      const revokedSessions = await tx.userSession.updateMany({
        where: {
          userId: user.id,
          isRevoked: false,
          expiresAt: { gt: now }, // Hanya yang belum expired
        },
        data: {
          isRevoked: true,
          revokedAt: now,
          fcmToken: null, // Clear FCM token dari session yang direvoke
        },
      });

      console.log(
        `🔒 Revoked ${revokedSessions.count} active sessions (1-device policy)`
      );

      // ✅ 3. INCREMENT TOKEN VERSION (Optional - jika mau force logout semua)
      // Hapus ini jika tidak perlu force logout global
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          tokenVersion: { increment: 1 },
          lastLoginAt: now,
          // lastLoginIp: ipAddress,
          // lastLoginDevice: userAgent?.substring(0, 100),
        },
      });

      console.log(`📈 Token version: ${updatedUser.tokenVersion}`);

      // ✅ 4. GENERATE TOKENS
      const accessToken = generateAccessToken(updatedUser);
      const refreshToken = generateRefreshToken(updatedUser);
      const sessionToken = crypto.randomBytes(32).toString("hex");

      // ✅ 5. EXTRACT DEVICE INFO
      const deviceInfo = extractDeviceInfo(userAgent);

      // ✅ 6. CREATE NEW SESSION
      const newSession = await tx.userSession.create({
        data: {
          userId: updatedUser.id,
          sessionToken,
          refreshToken,
          ipAddress: ipAddress.substring(0, 45), // IPv6 max 45 chars
          userAgent: userAgent.substring(0, 500),
          deviceId: deviceId?.substring(0, 255) || null,
          // deviceType: deviceInfo.deviceType,
          // deviceName: deviceInfo.deviceName,
          origin: origin?.substring(0, 255) || null,
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 hari
          isRevoked: false,
          lastActiveAt: now,
          // Geolocation (optional)
          ...(ipAddress !== "127.0.0.1" &&
          ipAddress !== "::1" &&
          ipAddress !== "unknown"
            ? {
                country: "ID", // Default, bisa diisi dari IP lookup
                city: "Unknown",
              }
            : {
                country: "Local",
                city: "Localhost",
              }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      console.log(`✅ New session: ${newSession.id.substring(0, 8)}...`);

      // ✅ 7. GET ALL SESSIONS untuk emit
      const allSessions = await tx.userSession.findMany({
        where: {
          userId: updatedUser.id,
          createdAt: { gte: sevenDaysAgo }, // Hanya 7 hari terakhir
        },
        orderBy: { lastActiveAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      // ✅ 8. VALIDASI: Pastikan HANYA 1 session aktif
      const activeSessions = allSessions.filter(
        (s) => !s.isRevoked && s.expiresAt > now
      );
      if (activeSessions.length > 1) {
        console.error(
          `❌ CRITICAL: Still ${activeSessions.length} active sessions after cleanup!`
        );

        // Auto-fix DALAM TRANSACTION YANG SAMA
        const sessionsToRevoke = activeSessions.slice(1); // Keep first one
        await tx.userSession.updateMany({
          where: {
            id: { in: sessionsToRevoke.map((s) => s.id) },
          },
          data: {
            isRevoked: true,
            revokedAt: now,
            fcmToken: null,
            revokeReason: "auto_fix_multiple_active",
          },
        });

        console.log(
          `🛠️ Auto-fixed: Revoked ${sessionsToRevoke.length} extra sessions`
        );

        // Update allSessions array
        sessionsToRevoke.forEach((session) => {
          session.isRevoked = true;
          session.revokedAt = now;
          session.fcmToken = null;
        });
      }

      // ✅ 9. VALIDASI FINAL
      const finalActiveCount = allSessions.filter(
        (s) => !s.isRevoked && s.expiresAt > now
      ).length;
      if (finalActiveCount !== 1) {
        throw new Error(
          `Session policy violation: ${finalActiveCount} active sessions for user ${user.id}`
        );
      }

      return {
        accessToken,
        refreshToken,
        session: newSession,
        user: updatedUser,
        allSessions,
        activeSessionCount: finalActiveCount,
      };
    });

    // ✅ 10. FORMAT SESSIONS UNTUK EMIT (konsisten dengan frontend)
    const formattedSessions = result.allSessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      user: {
        id: session.user?.id,
        name: session.user?.name || user.name,
        email: session.user?.email || user.email,
        avatar: session.user?.avatar,
      },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceInfo: extractDeviceInfo(session.userAgent),
      createdAt: session.createdAt.toISOString(),
      lastActiveAt:
        session.lastActiveAt?.toISOString() || session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      isRevoked: session.isRevoked,
      revokedAt: session.revokedAt?.toISOString() || null,
      fcmToken: session.fcmToken,
      location: session.country
        ? {
            country: session.country,
            city: session.city,
          }
        : null,
      status:
        !session.isRevoked && session.expiresAt > new Date()
          ? "active"
          : "revoked",
    }));

    console.log(
      `📋 Total sessions: ${formattedSessions.length}, Active: ${result.activeSessionCount}`
    );

    // ✅ 11. EMIT KE SOCKET
    if (io) {
      const room = `user:${result.user.id}`;

      // Wait a bit untuk pastikan client sudah connect
      setTimeout(() => {
        const roomSockets = io.sockets.adapter.rooms.get(room);
        const socketCount = roomSockets ? roomSockets.size : 0;

        const emitData = {
          type: "sessions_updated",
          sessions: formattedSessions,
          activeSessionId: result.session.id,
          timestamp: new Date().toISOString(),
          policy: "one_session_per_user",
        };

        if (socketCount > 0) {
          console.log(
            `📨 Emitting to ${socketCount} socket(s) in room ${room}`
          );
          io.to(room).emit("sessions:updated", emitData);

          // Juga emit event khusus untuk frontend admin panel
          io.emit("admin:sessions:updated", {
            userId: result.user.id,
            sessionCount: formattedSessions.length,
            timestamp: new Date().toISOString(),
          });
        } else {
          console.log(
            `⏳ User ${result.user.id} not connected, session data ready`
          );
        }
      }, 100); // Delay 100ms
    }

    // ✅ 12. LOG ACTIVITY
    // await prisma.auditLog.create({
    //   data: {
    //     action: "USER_LOGIN",
    //     userId: user.id,
    //     entityType: "UserSession",
    //     entityId: result.session.id,
    //     details: JSON.stringify({
    //       ip: ipAddress,
    //       device: userAgent?.substring(0, 100),
    //       sessionCount: formattedSessions.length,
    //       policy: "single_session",
    //     }),
    //     ipAddress: ipAddress,
    //     userAgent: userAgent,
    //   },
    // });

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      session: result.session,
      user: result.user,
      sessions: formattedSessions,
    };
  } catch (error) {
    console.error("[SESSION] ❌ Error:", {
      message: error.message,
      userId: user?.id,
      stack: error.stack?.split("\n")[0],
    });

    // Re-throw untuk ditangani oleh caller
    throw new Error(`Session creation failed: ${error.message}`);
  }
}

// Helper function
function extractDeviceInfo(userAgent) {
  const ua = userAgent || "";
  let deviceType = "unknown";
  let deviceName = "Unknown";

  if (ua.includes("Mobile")) deviceType = "mobile";
  else if (ua.includes("Tablet")) deviceType = "tablet";
  else if (ua.includes("Windows")) deviceType = "desktop";
  else if (ua.includes("Mac")) deviceType = "desktop";
  else if (ua.includes("Linux")) deviceType = "desktop";

  // Extract browser/device name
  if (ua.includes("Chrome")) deviceName = "Chrome";
  else if (ua.includes("Firefox")) deviceName = "Firefox";
  else if (ua.includes("Safari")) deviceName = "Safari";
  else if (ua.includes("Android")) deviceName = "Android";
  else if (ua.includes("iPhone")) deviceName = "iPhone";

  return { deviceType, deviceName };
}

// ✅ HELPER FUNCTION: Extract device info
// function extractDeviceInfo(userAgent) {
//   try {
//     const ua = userAgent.toLowerCase();

//     const info = {
//       isMobile: ua.includes("mobile"),
//       isTablet: ua.includes("tablet"),
//       isDesktop: !ua.includes("mobile") && !ua.includes("tablet"),
//       os: "Unknown",
//       browser: "Unknown",
//     };

//     // Deteksi OS
//     if (ua.includes("windows")) info.os = "Windows";
//     else if (ua.includes("mac os")) info.os = "macOS";
//     else if (ua.includes("linux")) info.os = "Linux";
//     else if (ua.includes("android")) info.os = "Android";
//     else if (ua.includes("ios") || ua.includes("iphone")) info.os = "iOS";

//     // Deteksi Browser
//     if (ua.includes("chrome")) info.browser = "Chrome";
//     else if (ua.includes("firefox")) info.browser = "Firefox";
//     else if (ua.includes("safari") && !ua.includes("chrome"))
//       info.browser = "Safari";
//     else if (ua.includes("edge")) info.browser = "Edge";

//     return info;
//   } catch {
//     return {
//       isMobile: false,
//       isTablet: false,
//       isDesktop: true,
//       os: "Unknown",
//       browser: "Unknown",
//     };
//   }
// }

// Constants untuk error messages
const ERROR_MESSAGES = {
  INVALID_CODE: "Authorization+code+is+missing+or+invalid",
  OAUTH_FAILED: "OAuth+authentication+failed",
  NOT_AUTHORIZED: "You+are+not+authorized+to+access+this+system",
  INVALID_GRANT:
    "Authorization+code+is+invalid+or+expired.+Please+try+logging+in+again.",
  NO_EMAIL: "Failed+to+retrieve+valid+email+from+Google.",
  EXCHANGE_FAILED: "Authentication+service+unavailable.+Please+try+again.",
  PROFILE_FETCH_FAILED:
    "Could+not+retrieve+user+information.+Please+try+again.",
  CONNECTION_TIMEOUT: "Connection+timeout.+Please+try+again.",
  INTERNAL_ERROR: "An+unexpected+error+occurred.+Please+try+again.",
};

// ✅ PERBAIKAN: Google Login - FIXED VERSION
export const googleLogin = async (req, res) => {
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (!frontendUrl) {
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Internal Server Error: Application configuration missing",
      });
    }
    return;
  }

  const { code, error: oauthError } = req.query;
  const loginUrl = `${frontendUrl}/auth/loginAdmin`;
  const successUrl = `${frontendUrl}/admin-area`;

  if (oauthError) {
    return res.redirect(`${loginUrl}?error=${ERROR_MESSAGES.OAUTH_FAILED}`);
  }

  if (!code || typeof code !== "string") {
    return res.redirect(`${loginUrl}?error=${ERROR_MESSAGES.INVALID_CODE}`);
  }

  const sanitizedCode = code.trim();

  try {
    let tokenRes;
    try {
      const tokenData = new URLSearchParams({
        code: sanitizedCode,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      });

      tokenRes = await axios.post(
        "https://oauth2.googleapis.com/token",
        tokenData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000,
        }
      );
    } catch (tokenError) {
      if (tokenError.response?.data?.error === "invalid_grant") {
        if (
          tokenError.response?.data?.error_description?.includes("Malformed")
        ) {
          throw new Error(
            "Authentication+failed+due+to+invalid+authorization+code"
          );
        }
        throw new Error(ERROR_MESSAGES.INVALID_GRANT);
      }

      if (tokenError.response?.data?.error === "invalid_request") {
        throw new Error("Invalid+authentication+request.+Please+try+again.");
      }

      throw new Error(ERROR_MESSAGES.EXCHANGE_FAILED);
    }

    const { access_token, id_token } = tokenRes.data;

    if (!access_token) {
      throw new Error("No access token received from Google");
    }

    let profileRes;
    try {
      profileRes = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );
    } catch (profileError) {
      throw new Error(ERROR_MESSAGES.PROFILE_FETCH_FAILED);
    }

    const { id: googleId, email, name, picture: avatar } = profileRes.data;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new Error(ERROR_MESSAGES.NO_EMAIL);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const allowedEmail = await prisma.accountEmail.findUnique({
      where: { email: normalizedEmail },
    });

    if (!allowedEmail) {
      return res.redirect(`${loginUrl}?error=${ERROR_MESSAGES.NOT_AUTHORIZED}`);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      existingUser &&
      existingUser.provider !== "google" &&
      existingUser.provider !== null
    ) {
      return res.redirect(
        `${loginUrl}?error=Account+already+exists+with+different+login+method`
      );
    }

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: name || undefined,
        avatar: avatar || undefined,
        googleId,
        provider: "google",
        lastLoginAt: new Date(),
        role: allowedEmail?.role || existingUser?.role,
      },
      create: {
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        avatar,
        googleId,
        provider: "google",
        role: allowedEmail?.role || "user",
        lastLoginAt: new Date(),
        tokenVersion: 0,
      },
    });

    let accessToken, refreshToken;
    try {
      const tokens = await createUserSession(user, req);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    } catch (sessionError) {
      accessToken = generateAccessToken(user);
      refreshToken = generateRefreshToken(user);
    }

    setTokenCookies(res, accessToken, refreshToken);

    return res.redirect(302, successUrl);
  } catch (err) {
    let errorMessage = ERROR_MESSAGES.INTERNAL_ERROR;

    if (err.message.includes(ERROR_MESSAGES.INVALID_GRANT)) {
      errorMessage = ERROR_MESSAGES.INVALID_GRANT;
    } else if (err.message.includes(ERROR_MESSAGES.NO_EMAIL)) {
      errorMessage = ERROR_MESSAGES.NO_EMAIL;
    } else if (err.message.includes(ERROR_MESSAGES.EXCHANGE_FAILED)) {
      errorMessage = ERROR_MESSAGES.EXCHANGE_FAILED;
    } else if (err.message.includes(ERROR_MESSAGES.PROFILE_FETCH_FAILED)) {
      errorMessage = ERROR_MESSAGES.PROFILE_FETCH_FAILED;
    } else if (err.code === "ECONNABORTED") {
      errorMessage = ERROR_MESSAGES.CONNECTION_TIMEOUT;
    } else if (
      err.message.includes("Malformed") ||
      err.message.includes("invalid+authorization+code")
    ) {
      errorMessage =
        "Authentication+failed+due+to+invalid+authorization+code.+Please+try+again.";
    }

    if (!res.headersSent) {
      return res.redirect(`${loginUrl}?error=${errorMessage}`);
    } else {
      if (!res.writableEnded) {
        return res.status(500).json({
          success: false,
          error: "Authentication failed",
        });
      }
    }
  }
};

// ✅ PERBAIKAN: Session management functions - UPDATED
export const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        sessionToken: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
        isRevoked: true,
      },
    });

    res.json({
      success: true,
      sessions: sessions.map((session) => ({
        ...session,
        userAgent: session.userAgent || "Unknown",
        ipAddress: session.ipAddress || "Unknown",
        // Jangan expose full sessionToken untuk security
        sessionToken: session.sessionToken
          ? `${session.sessionToken.substring(0, 8)}...`
          : null,
      })),
    });
  } catch (err) {
    console.error("[GET /sessions ERROR]", err);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve login sessions",
    });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Pastikan session yang akan di-revoke milik user yang sama
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
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

    // Update session menjadi revoked
    const updatedSession = await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    // Ambil semua sessions terbaru untuk emit ke socket
    const allSessions = await prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastActiveAt: "desc" },
    });

    // Format untuk socket emit
    const formattedSessions = allSessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      isRevoked: s.isRevoked,
      createdAt: s.createdAt.toISOString(),
      lastActiveAt: s.lastActiveAt?.toISOString() || s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      fcmToken: s.fcmToken,
    }));

    // Emit ke socket room user
    if (req.io) {
      req.io.to(`user:${userId}`).emit("session:updated", {
        sessions: formattedSessions,
        timestamp: new Date().toISOString(),
        action: "session_revoked",
        revokedSessionId: sessionId,
      });
    }

    res.json({
      success: true,
      message: "Session revoked successfully",
      data: {
        id: updatedSession.id,
        revokedAt: updatedSession.revokedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[SESSION] Error revoking session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to revoke session",
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
    const revoked = await prisma.userSession.updateMany({
      where: {
        userId,
        isRevoked: false,
        id: { not: currentSessionId },
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    // Ambil semua sessions terbaru
    const allSessions = await prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastActiveAt: "desc" },
    });

    // Format untuk response dan socket
    const formattedSessions = allSessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isRevoked: session.isRevoked,
      createdAt: session.createdAt.toISOString(),
      lastActiveAt:
        session.lastActiveAt?.toISOString() || session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      fcmToken: session.fcmToken,
    }));

    // Emit ke socket
    if (req.io) {
      req.io.to(`user:${userId}`).emit("session:updated", {
        sessions: formattedSessions,
        timestamp: new Date().toISOString(),
        action: "revoked_all_others",
        revokedCount: revoked.count,
      });
    }

    res.json({
      success: true,
      message: `Revoked ${revoked.count} other sessions`,
      data: {
        revokedCount: revoked.count,
        sessions: formattedSessions,
      },
    });
  } catch (error) {
    console.error("[SESSION] Error revoking other sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to revoke other sessions",
    });
  }
};

export const revokeAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.userSession.updateMany({
      where: {
        userId: userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    // ✅ PERBAIKAN: Increment token version untuk invalidate semua token
    await prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    res.json({
      success: true,
      message: "All sessions revoked successfully",
    });
  } catch (err) {
    console.error("[DELETE /sessions ERROR]", err);
    res.status(500).json({
      success: false,
      error: "Failed to revoke all sessions",
    });
  }
};

// ✅ PERBAIKAN: Fungsi untuk handle token version mismatch
export const handleTokenVersionMismatch = async (userId) => {
  try {
    // Revoke all active sessions
    const revokedSessions = await prisma.userSession.updateMany({
      where: {
        userId: userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    // Reset token version ke 0
    const resetUser = await prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: 0,
      },
    });

    return resetUser;
  } catch (error) {
    console.error("[AUTH] Error handling token version mismatch:", error);
    throw error;
  }
};

// ✅ PERBAIKAN: Fungsi untuk logout user
export const logoutUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userId = req.user.id;
    const io = req.app.get("io"); // Dapatkan io instance

    console.log(`[LOGOUT] User ${userId} logging out`);

    // 1️⃣ Dapatkan session token dari cookies/socket
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    // Cari session yang akan di-revoke
    const currentSession = await prisma.userSession.findFirst({
      where: {
        userId: userId,
        refreshToken: refreshToken,
        isRevoked: false,
      },
    });

    if (!currentSession) {
      console.log(`[LOGOUT] ❌ No active session found for user ${userId}`);
      // Tetap clear cookies
      clearAuthCookies(res);
      return res.json({
        success: true,
        message: "Logout completed (no active session found)",
      });
    }

    // 2️⃣ Revoke session menggunakan function yang benar
    await prisma.userSession.update({
      where: { id: currentSession.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        sessionToken: null,
        refreshToken: null,
        fcmToken: null,
      },
    });

    console.log(
      `[LOGOUT] ✅ Session ${currentSession.id.substring(0, 8)} revoked`
    );

    // 3️⃣ EMIT SOCKET EVENT SEBELUM CLEAR COOKIES
    if (io) {
      try {
        // Get updated sessions untuk user
        const userSessions = await prisma.userSession.findMany({
          where: { userId: userId },
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

        // Format sessions
        const formattedSessions = userSessions.map((session) => ({
          id: session.id,
          userId: session.userId,
          userAgent: session.userAgent || "Unknown",
          ipAddress: session.ipAddress || "0.0.0.0",
          isRevoked: session.isRevoked || false,
          isCurrent: session.id === currentSession.id, // Tandai yang direvoke
          createdAt: session.createdAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
          revokedAt: session.revokedAt ? session.revokedAt.toISOString() : null,
          user: session.user,
        }));

        console.log(`[SOCKET] Emitting logout event for user ${userId}`);

        // EMIT ke user room
        io.to(`user:${userId}`).emit("session:updated", {
          sessions: formattedSessions,
          type: "logout",
          revokedSessionId: currentSession.id,
          timestamp: new Date().toISOString(),
        });

        // EMIT ke admin room juga
        const allSessions = await prisma.userSession.findMany({
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

        io.to("room:admins").emit("session:updated", {
          sessions: allSessions,
          type: "admin-update",
          affectedUser: userId,
          timestamp: new Date().toISOString(),
        });

        console.log(`✅ [LOGOUT] Socket events emitted for user ${userId}`);
      } catch (socketError) {
        console.warn("⚠️ Socket emit error during logout:", socketError);
      }
    }

    // 4️⃣ Increment token version
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    // 5️⃣ Clear cookies
    clearAuthCookies(res);

    return res.json({
      success: true,
      message: "Logout successful",
      sessionId: currentSession.id,
      socketNotified: io ? true : false,
    });
  } catch (err) {
    console.error("[LOGOUT] Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to logout",
    });
  }
};

// ✅ PERBAIKAN: Fungsi untuk logout dari semua devices
export const logoutAllDevices = async (req, res) => {
  try {
    console.log("[LOGOUT] Logout all devices requested");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userId = req.user.id;
    console.log(`[LOGOUT] Logout all devices for user: ${userId}`);

    // 1️⃣ Revoke all sessions
    const result = await prisma.userSession.updateMany({
      where: {
        userId: userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
    console.log(`[LOGOUT] Revoked ${result.count} sessions`);

    // 2️⃣ Increment token version
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    console.log(`[LOGOUT] Token version incremented`);

    // 3️⃣ Clear cookies dengan nama YANG SAMA
    Object.values(COOKIE_NAMES).forEach((cookieName) => {
      res.clearCookie(cookieName, COOKIE_CONFIG);
      console.log(`[LOGOUT] Cleared cookie: ${cookieName}`);
    });

    console.log(`[LOGOUT] Logout all devices completed for user: ${userId}`);

    res.json({
      success: true,
      message: "Logged out from all devices successfully",
      sessionsRevoked: result.count,
    });
  } catch (err) {
    console.error("[LOGOUT] Logout all devices error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to logout from all devices",
    });
  }
};

// ✅ Debug endpoint untuk check cookies
export const debugCookies = async (req, res) => {
  try {
    const cookies = req.cookies || {};
    const cookieNames = Object.keys(cookies);

    console.log("[COOKIE_DEBUG] Current cookies:", cookieNames);

    res.json({
      success: true,
      cookies: {
        names: cookieNames,
        hasAccessToken: !!cookies[COOKIE_NAMES.ACCESS_TOKEN],
        hasRefreshToken: !!cookies[COOKIE_NAMES.REFRESH_TOKEN],
        totalCookies: cookieNames.length,
      },
    });
  } catch (err) {
    console.error("[COOKIE_DEBUG] Error:", err);
    res.status(500).json({ success: false, error: "Debug failed" });
  }
};

export default {
  googleLogin,
  getSessions,
  revokeSession,
  revokeAllSessions,
  handleTokenVersionMismatch,
  logoutUser,
  logoutAllDevices,
};
// 🔹 FUNGSI LAINNYA TETAP SAMA (tidak diubah) 🔹

// Di backend login controller (adminLogin)
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(403).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(403).json({ error: "Invalid credentials" });

    if (user.mfaEnabled) {
      const mfaTempToken = jwt.sign(
        { userId: user.id, purpose: "MFA_VERIFICATION" },
        process.env.MFA_TEMP_SECRET,
        { expiresIn: "5m" }
      );

      return res.json({
        success: true,
        mfaRequired: true,
        mfaTempToken,
      });
    }

    // ✅ GUNAKAN createUserSession UNTUK GENERATE TOKENS DAN SIMPAN SESSION
    const { accessToken, refreshToken } = await createUserSession(user, req);

    // ✅ STANDARDIZED: GUNAKAN setTokenCookies UNTUK KONSISTENSI
    setTokenCookies(res, accessToken, refreshToken);

    res.header("Access-Control-Allow-Credentials", "true");
    const allowedOrigin =
      process.env.NODE_ENV === "production"
        ? "https://rylif-app.com"
        : "http://localhost:3000";

    res.header("Access-Control-Allow-Origin", allowedOrigin);
    res.header("Access-Control-Allow-Credentials", "true");

    return res.json({
      success: true,
      mfaRequired: false,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const activateMfaSetup = async (req, res) => {
  // console.log("UserId for MFA Setup:", req.user);

  try {
    const userId = req.user.userId;

    // Generate MFA secret
    const secret = speakeasy.generateSecret({ length: 20 });

    // Generate QR Code dari otpauth_url
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Update user: aktifkan MFA dan simpan secret
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: secret.base32,
      },
    });

    // Kirimkan secret dan QR code ke frontend
    res.json({
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
    });
  } catch (err) {
    console.error("[ACTIVATE MFA SETUP ERROR]", err);
    res.status(500).json({ error: "Gagal mengaktifkan MFA" });
  }
};

export const getMFAStatus = async (req, res) => {
  try {
    const userId = req.user?.id ?? req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const deviceId = req.headers["x-device-id"];
    if (!deviceId) {
      return res.status(400).json({
        error: "Missing device identifier",
        code: "DEVICE_ID_REQUIRED",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaSecret: true,
        trustedDevices: {
          select: { deviceId: true, isRevoked: true },
        },
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const mfaEnabled = !!user.mfaSecret;

    if (!mfaEnabled) {
      return res.json({
        mfaRequired: false,
        mfaEnabled: false,
      });
    }

    const deviceTrusted = user.trustedDevices.some(
      (d) => d.deviceId === deviceId && !d.isRevoked
    );

    // === Device sudah trusted → langsung lanjut login ===
    if (deviceTrusted) {
      return res.json({
        mfaRequired: false,
        mfaEnabled: true,
      });
    }

    // === Device tidak dikenal → butuh OTP ===
    const tempToken = jwt.sign(
      {
        userId: user.id,
        purpose: "MFA_VERIFICATION",
        deviceId,
      },
      process.env.MFA_TEMP_SECRET,
      { expiresIn: "5m" }
    );

    return res.json({
      mfaRequired: true,
      mfaEnabled: true,
      tempToken,
    });
  } catch (error) {
    console.error("[MFA STATUS ERROR]", error);
    return res.status(500).json({
      error: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
};

export const setupMFA = async (req, res) => {
  try {
    const tempToken = req.headers.authorization?.replace("Bearer ", "").trim();
    if (!tempToken) {
      return res.status(400).json({ error: "Missing temporary MFA token" });
    }

    const payload = jwt.verify(tempToken, process.env.MFA_TEMP_SECRET);

    if (!payload.userId || payload.purpose !== "MFA_VERIFICATION") {
      return res.status(401).json({ error: "Invalid MFA setup token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, mfaSecret: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Jika sudah ada MFA secret → gunakan kembali
    let secret = user.mfaSecret;

    if (!secret) {
      secret = speakeasy.generateSecret({
        length: 20,
        name: `MyApp (${user.email})`,
      }).base32;

      await prisma.user.update({
        where: { id: payload.userId },
        data: { mfaSecret: secret },
      });
    }

    const otpauthUrl = speakeasy.otpauthURL({
      secret,
      label: `MyApp (${user.email})`,
      issuer: "MyApp",
      encoding: "base32",
    });

    const qrCode = await QRCode.toDataURL(otpauthUrl);

    return res.json({
      success: true,
      secret,
      qrCode,
      message: "Scan QR dengan Google Authenticator lalu masukkan OTP",
    });
  } catch (error) {
    console.error("[MFA Setup Error]", error);
    return res.status(500).json({
      error: "Failed to setup MFA",
      details: error.message,
    });
  }
};

export const completeMfaSetup = async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Generate proper token with all required fields
    const tempToken = jwt.sign(
      {
        userId: req.user.userId, // REQUIRED
        purpose: "MFA_VERIFICATION", // REQUIRED
        deviceId: req.headers["x-device-id"] || req.ip,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.MFA_TEMP_SECRET,
      { expiresIn: "5m" } // 5 minute expiration
    );

    return res.json({
      success: true,
      tempToken,
      message: "Proceed with OTP verification",
    });
  } catch (error) {
    console.error("[MFA_COMPLETE_SETUP_ERROR]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const newVerifyMFA = async (req, res) => {
  const { otp, rememberDevice } = req.body;
  const token = req.headers.authorization?.replace("Bearer ", "");

  const payload = jwt.verify(token, process.env.MFA_TEMP_SECRET);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, mfaSecret: true },
  });

  const isValid = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: "base32",
    token: otp,
    window: 1,
  });

  if (!isValid) {
    return res.status(401).json({ error: "Invalid OTP" });
  }

  const accessToken = generateAccessToken(user);

  return res.json({
    success: true,
    accessToken,
  });
};

export const verifyMFA = async (req, res) => {
  try {
    const { tempToken, code, rememberDevice } = req.body;

    // console.log("[MFA VERIFY BODY]", req.body);

    if (!tempToken || !code) {
      return res.status(400).json({ error: "Data tidak lengkap" });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.MFA_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Token MFA tidak valid" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.mfaSecret) {
      return res
        .status(401)
        .json({ error: "User tidak ditemukan atau MFA belum aktif" });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid) {
      return res.status(400).json({ error: "Kode OTP salah" });
    }

    // ✅ Trusted Device
    let deviceToken = req.cookies["trusted_device"];
    if (!deviceToken && rememberDevice) {
      deviceToken = generateDeviceToken();
      await prisma.trustedDevice.create({
        data: {
          userId: user.id,
          deviceToken,
          deviceInfo: req.headers["user-agent"],
        },
      });
      res.cookie("trusted_device", deviceToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 1000 * 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    // Success response (lanjutkan sesuai flow aplikasi)
    res.json({ success: true, message: "MFA verified", userId: user.id });
  } catch (err) {
    console.error("[MFA Verify Error]", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const adminLoginRegister = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "super" || user.provider !== "credentials") {
    return res.status(403).json({ error: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) return res.status(403).json({ error: "Invalid credentials" });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setTokenCookies(res, accessToken, refreshToken);

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
  });
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const registerEmail = async (req, res) => {
  const { email, role } = req.body;

  // Validasi format email
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    // Cek apakah email sudah terdaftar di AccountEmail
    const existingEmail = await prisma.accountEmail.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    // Simpan ke AccountEmail
    await prisma.accountEmail.create({
      data: { email },
    });

    // Cek apakah user dengan email ini sudah ada di tabel User
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // Jika belum ada, simpan ke User juga
    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: email,
          provider: "google",
          role: role, // ✅ di dalam `data`
        },
      });
    }

    return res.status(200).json({ success: "Email registered successfully." });
  } catch (err) {
    console.error("Register Email Error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
};

export const registerAdmin = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Cek apakah email sudah digunakan
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password dan simpan user baru
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        provider: "credentials",
        role: "admin",
      },
    });

    return res.status(201).json({ success: true, user });
  } catch (error) {
    // Tangani error Prisma (misal, duplikat field unik lainnya)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(400)
        .json({ message: "A user with this email already exists." });
    }

    // Tangani error tak terduga
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    // ✅ Middleware 'authenticateToken' sudah menjamin req.user ada.
    // Tapi pengecekan double ini bagus untuk safety (Defensive Programming).
    if (!req.user || !req.user.id) {
      console.error("[PROFILE] req.user is missing. Middleware failed?");
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        provider: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.error(`[PROFILE] User not found with ID: ${req.user.id}`);
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        ...user,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      },
    });
  } catch (err) {
    console.error("[PROFILE] Error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve user profile",
    });
  }
};

export const refreshHandler = async (req, res) => {
  console.log("🔄 [REFRESH HANDLER] Dimulai");

  const token = req.cookies.refreshToken;

  if (!token) {
    console.log("❌ Refresh token tidak ditemukan");
    return res.status(401).json({
      error: "NO_TOKEN",
      message: "Token tidak ditemukan",
    });
  }

  try {
    // 1️⃣ VERIFIKASI TOKEN
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    console.log("✅ Token valid, user ID:", payload.userId);

    // 2️⃣ CEK SESSION DALAM DATABASE
    const session = await prisma.userSession.findFirst({
      where: {
        userId: payload.userId,
        refreshToken: token,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      console.log("❌ Session sudah di-revoke atau tidak ada");

      clearAuthCookies(res); // ⬅️ Hapus cookie jika session tidak valid

      return res.status(401).json({
        error: "SESSION_REVOKED",
        message: "Akun sedang digunakan di perangkat lain",
        code: "DEVICE_CONFLICT",
      });
    }

    // 3️⃣ CEK USER MASIH ADA
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      console.log("❌ User tidak ditemukan di database");

      clearAuthCookies(res); // ⬅️ Hapus cookie bila user tidak ada

      return res.status(404).json({
        error: "USER_NOT_FOUND",
        message: "User tidak ditemukan di server",
      });
    }

    // 4️⃣ BUAT TOKEN BARU
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // 5️⃣ UPDATE SESSION REFRESH TOKEN DI DB
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari lagi
      },
    });

    // 6️⃣ SET COOKIE BARU
    setTokenCookies(res, newAccessToken, newRefreshToken);

    console.log("🔐 Token berhasil diperbarui");

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      message: "Token refreshed successfully",
    });
  } catch (err) {
    console.error("🔥 [REFRESH ERROR]", err.name, err.message);

    // Hapus cookie untuk error token
    clearAuthCookies(res);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "TOKEN_EXPIRED",
        message: "Token telah kadaluarsa",
      });
    }

    return res.status(401).json({
      error: "INVALID_REFRESH_TOKEN",
      message: "Refresh token tidak valid",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    // VALIDASI: Pastikan req.user dan req.user.id ada
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Invalid user data",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        provider: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        ...user,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve current user",
    });
  }
};

// ✅ ENDPOINT: /api/auth/user-login/profile - untuk kompatibilitas dengan use-current-user.ts
export const getUserLoginProfile = async (req, res) => {
  try {
    // VALIDASI: Pastikan req.user dan req.user.id ada
    if (!req.user) {
      console.error(
        "[AUTH] /api/auth/user-login/profile - req.user is missing"
      );
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!req.user.id) {
      console.error(
        "[AUTH] /api/auth/user-login/profile - req.user.id is undefined"
      );
      return res.status(401).json({
        success: false,
        error: "Invalid user data",
      });
    }
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        provider: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.error(
        `[AUTH] /api/auth/user-login/profile - User not found with ID: ${req.user.id}`
      );
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        ...user,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      },
    });
  } catch (err) {
    console.error("[AUTH] /api/auth/user-login/profile - Error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve user profile",
    });
  }
};

export const authMe = async (req, res) => {
  try {
    const token = req.cookies.accessTokenReadable;

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    // Decode tanpa verify agar tidak error jika expired
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const session = await prisma.userSession.findFirst({
      where: {
        userId: decoded.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return res.status(401).json({ message: "Session expired" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("[authMe ERROR]", error);
    return res.status(500).json({ message: "Internal error" });
  }
};
