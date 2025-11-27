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
  console.log(
    `[TOKEN] Generating access token with version: ${user.tokenVersion}`
  );
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
  console.log(
    `[TOKEN] Generating refresh token with version: ${user.tokenVersion}`
  );
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

// ✅ PERBAIKAN: Session management dengan urutan YANG BENAR
async function createUserSession(user, req) {
  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"] || "Unknown";

  // ✅ Validasi user data
  if (!user?.id) {
    throw new Error("Invalid user data for session creation");
  }

  console.log(
    `[SESSION] Before update - User tokenVersion: ${user.tokenVersion}`
  );

  // ✅ 1. INCREMENT TOKEN VERSION TERLEBIH DAHULU
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      tokenVersion: { increment: 1 },
      lastLoginAt: new Date(),
    },
  });

  console.log(
    `[SESSION] After update - User tokenVersion: ${updatedUser.tokenVersion}`
  );

  // ✅ 2. GENERATE TOKENS SETELAH INCREMENT (dengan version yang sudah di-update)
  const accessToken = generateAccessToken(updatedUser);
  const refreshToken = generateRefreshToken(updatedUser);

  // ✅ 3. Generate session token
  const sessionToken = crypto.randomBytes(32).toString("hex");

  // ✅ 4. CREATE SESSION DENGAN TOKENS YANG SUDAH UPDATED
  await prisma.userSession.create({
    data: {
      userId: updatedUser.id,
      sessionToken,
      refreshToken,
      ipAddress: ipAddress?.toString().substring(0, 255) || "Unknown",
      userAgent: userAgent.substring(0, 500),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  console.log(`[SESSION] Session created successfully for user: ${user.id}`);

  // ✅ Return both tokens
  return { accessToken, refreshToken };
}

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
  // Validasi environment variables
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (!frontendUrl) {
    console.error("NEXT_PUBLIC_FRONTEND_URL is not configured");
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

  // ✅ PERBAIKAN: Handle OAuth errors dari Google
  if (oauthError) {
    console.error("OAuth error from Google:", oauthError);
    return res.redirect(`${loginUrl}?error=${ERROR_MESSAGES.OAUTH_FAILED}`);
  }

  // ✅ PERBAIKAN: Validasi input yang konsisten
  if (!code || typeof code !== "string") {
    return res.redirect(`${loginUrl}?error=${ERROR_MESSAGES.INVALID_CODE}`);
  }

  // ✅ PERBAIKAN FIX: Hanya trim, jangan hapus karakter khusus
  const sanitizedCode = code.trim();

  // ✅ DEBUG: Log code length dan karakter
  console.log(
    `[GOOGLE] Auth code received: ${sanitizedCode.length} characters`
  );
  console.log(
    `[GOOGLE] Code starts with: ${sanitizedCode.substring(0, 10)}...`
  );

  try {
    // ✅ PERBAIKAN: Token exchange dengan error handling yang better
    let tokenRes;
    try {
      const tokenData = new URLSearchParams({
        code: sanitizedCode,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      });

      console.log(
        `[GOOGLE] Token exchange request for code length: ${sanitizedCode.length}`
      );

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
      console.error(
        "[GOOGLE] Token exchange error:",
        tokenError.response?.data || tokenError.message
      );

      // ✅ PERBAIKAN: Handle specific Google OAuth errors
      if (tokenError.response?.data?.error === "invalid_grant") {
        if (
          tokenError.response?.data?.error_description?.includes("Malformed")
        ) {
          console.error(
            "[GOOGLE] Malformed auth code - possible sanitization issue"
          );
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

    console.log("[GOOGLE] Successfully obtained access token from Google");

    // ✅ PERBAIKAN: Get user profile dengan error handling
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
      console.error(
        "[GOOGLE] Profile fetch error:",
        profileError.response?.data || profileError.message
      );
      throw new Error(ERROR_MESSAGES.PROFILE_FETCH_FAILED);
    }

    const { id: googleId, email, name, picture: avatar } = profileRes.data;

    // ✅ PERBAIKAN: Validasi email yang comprehensive
    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new Error(ERROR_MESSAGES.NO_EMAIL);
    }

    const normalizedEmail = email.toLowerCase().trim();

    console.log(`[GOOGLE] Processing Google login for: ${normalizedEmail}`);

    // ✅ PERBAIKAN: Check authorization dengan error handling
    const allowedEmail = await prisma.accountEmail.findUnique({
      where: { email: normalizedEmail },
    });

    if (!allowedEmail) {
      console.warn(`[GOOGLE] Unauthorized login attempt: ${normalizedEmail}`);
      return res.redirect(`${loginUrl}?error=${ERROR_MESSAGES.NOT_AUTHORIZED}`);
    }

    // ✅ PERBAIKAN: User upsert dengan transaction-like consistency
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: name || undefined,
        avatar: avatar || undefined,
        googleId,
        provider: "google",
        lastLoginAt: new Date(),
      },
      create: {
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        avatar,
        googleId,
        provider: "google",
        role: "user",
        lastLoginAt: new Date(),
        tokenVersion: 0,
      },
    });

    console.log(
      `[GOOGLE] User ${user.id} current tokenVersion: ${user.tokenVersion}`
    );

    // ✅ PERBAIKAN: Session creation dengan urutan YANG BENAR
    let accessToken, refreshToken;
    try {
      const tokens = await createUserSession(user, req);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
      console.log(
        "[GOOGLE] Session created successfully with updated token versions"
      );
    } catch (sessionError) {
      console.error("[GOOGLE] Session creation error:", sessionError);
      // Fallback: generate tokens dengan version current (bukan incremented)
      console.warn("[GOOGLE] Using fallback tokens without session");
      accessToken = generateAccessToken(user);
      refreshToken = generateRefreshToken(user);
    }

    // ✅ PERBAIKAN: Set cookies dengan tokens yang sudah diperbarui
    setTokenCookies(res, accessToken, refreshToken);

    // ✅ PERBAIKAN: Success redirect dengan logging
    console.log(
      `[GOOGLE] Google login successful for user: ${normalizedEmail}`
    );
    return res.redirect(302, successUrl);
  } catch (err) {
    // ✅ PERBAIKAN: Error handling yang structured dan comprehensive
    console.error("--- GOOGLE LOGIN ERROR ---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error type:", err.name);
    console.error("Error message:", err.message);
    console.error("Stack trace:", err.stack);
    console.error("--- END OF ERROR REPORT ---");

    let errorMessage = ERROR_MESSAGES.INTERNAL_ERROR;

    // ✅ PERBAIKAN: Error mapping yang lebih specific menggunakan constants
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

    // ✅ PERBAIKAN: Pastikan headers belum terkirim sebelum redirect
    if (!res.headersSent) {
      return res.redirect(`${loginUrl}?error=${errorMessage}`);
    } else {
      console.error("Cannot redirect: Headers already sent");
      // Fallback response
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

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
    }

    const session = await prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId: userId,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    if (session.count === 0) {
      return res.status(404).json({
        success: false,
        error: "Session not found or already revoked",
      });
    }

    res.json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (err) {
    console.error("[DELETE /sessions/:id ERROR]", err);
    res.status(500).json({
      success: false,
      error: "Failed to revoke session",
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
    console.log(`[AUTH] Handling token version mismatch for user: ${userId}`);

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

    console.log(`[AUTH] Revoked ${revokedSessions.count} active sessions`);

    // Reset token version ke 0
    const resetUser = await prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: 0,
      },
    });

    console.log(`[AUTH] Token version reset to 0 for user: ${userId}`);

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
    console.log(`[LOGOUT] Logging out user: ${userId}`);

    // 1️⃣ DEBUG: Log cookies sebelum clear
    console.log("📝 Cookies before logout:", req.cookies);

    // 2️⃣ Revoke current session berdasarkan refreshToken
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
    if (refreshToken) {
      await prisma.userSession.updateMany({
        where: {
          refreshToken: refreshToken,
          userId: userId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });
      console.log(`[LOGOUT] Revoked session for user: ${userId}`);
    }

    // 3️⃣ Increment token version
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    // 4️⃣ CLEAR COOKIES - GUNAKAN FUNGSI YANG SUDAH DIPERBAIKI
    clearAuthCookies(res);

    // 5️⃣ DEBUG: Response dengan info clear
    return res.json({
      success: true,
      message: "Logout successful",
      cookiesCleared: Object.values(COOKIE_NAMES),
      environment: process.env.NODE_ENV,
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

export const adminLogin = async (req, res) => {
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

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return res.json({
    success: true,
    mfaRequired: false,
    accessToken,
    refreshToken,
  });
};

function setAuthCookies(res, refreshToken, sessionToken) {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sevenDays,
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.cookie("session_token", sessionToken, cookieOptions);
}

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
    select: { id: true, mfaSecret: true }
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
    accessToken
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
    console.log("[PROFILE] Getting user profile");

    // ✅ Tangkap token dari header Authorization
    const authHeader = req.headers["authorization"];
    let tokenFromHeader = null;
    if (authHeader && typeof authHeader === "string") {
      // Format: "Bearer <token>"
      tokenFromHeader = authHeader.split(" ")[1];
    }
    console.log("[PROFILE] Token from header:", tokenFromHeader);

    // ✅ Tangkap token dari cookie (jika menggunakan cookies)
    const tokenFromCookie = req.cookies?.accessToken || null;
    console.log("[PROFILE] Token from cookie:", tokenFromCookie);

    // ✅ VALIDASI: Pastikan req.user dan req.user.id ada
    if (!req.user) {
      console.error("[PROFILE] req.user is missing");
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!req.user.id) {
      console.error("[PROFILE] req.user.id is undefined");
      return res.status(401).json({
        success: false,
        error: "Invalid user data",
      });
    }

    console.log(`[PROFILE] Looking for user with ID: ${req.user.id}`);

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

    console.log(`[PROFILE] Profile found for: ${user.email}`);

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
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ error: "Refresh token missing" });
  }

  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);

    const session = await prisma.userSession.findFirst({
      where: {
        userId: payload.userId,
        refreshToken: token,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newAccessToken = generateAccessToken(user);

    // Set Access Token (8 jam)
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60 * 1000, // 8 jam
    });

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      message: "Token refreshed successfully",
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Refresh token expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    return res.status(401).json({ error: "Invalid refresh token" });
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
    console.log("[AUTH] Getting user profile for /api/auth/user-login/profile");

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

    console.log(
      `[AUTH] /api/auth/user-login/profile - Looking for user with ID: ${req.user.id}`
    );

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

    console.log(
      `[AUTH] /api/auth/user-login/profile - User found: ${user.email}`
    );

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
