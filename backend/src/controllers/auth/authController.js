// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import { prisma } from "../../config/db.js";

import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookie from "cookie";
import * as crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { setTokenCookies } from "../../utils/setCookies.js";

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

// ✅ PERBAIKAN: Token generation yang konsisten
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email, // Tambahkan email untuk konsistensi
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
      type: "refresh", // Tambahkan type untuk clarity
    },
    JWT_REFRESH_SECRET,
    TOKEN_CONFIG.refresh
  );
};

// ✅ PERBAIKAN: Session management yang lebih robust
async function createUserSession(user, refreshToken, req) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"] || "Unknown";

  // ✅ PERBAIKAN: Validasi dan batasi panjang string untuk database
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      sessionToken,
      refreshToken,
      ipAddress: ipAddress?.toString().substring(0, 255), // Prevent overflow
      userAgent: userAgent.substring(0, 500), // Prevent overflow
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
    },
  });

  return sessionToken;
}

// Tambahkan fungsi getSessions yang sesuai
export const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ PERBAIKAN: Gunakan model yang sesuai - UserSession bukan TrustedDeviceSession
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(), // Hanya sesi yang masih aktif
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
      sessions,
    });
  } catch (err) {
    console.error("[GET /sessions ERROR]", err);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve login sessions",
    });
  }
};

// ✅ PERBAIKAN: Google Login - FIXED VERSION
export const googleLogin = async (req, res) => {
  // Validasi environment variables
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (!frontendUrl) {
    console.error("NEXT_PUBLIC_FRONTEND_URL is not configured");
    // ✅ PERBAIKAN: Error handling yang konsisten
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
    return res.redirect(`${loginUrl}?error=OAuth+authentication+failed`);
  }

  // ✅ PERBAIKAN: Validasi input yang konsisten
  if (!code || typeof code !== "string") {
    return res.redirect(
      `${loginUrl}?error=Authorization+code+is+missing+or+invalid`
    );
  }

  try {
    // ✅ PERBAIKAN: Token exchange dengan error handling yang better
    let tokenRes;
    try {
      tokenRes = await axios.post(
        "https://oauth2.googleapis.com/token",
        new URLSearchParams({
          code: code.trim(),
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_CALLBACK_URL,
          grant_type: "authorization_code",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000, // ✅ PERBAIKAN: Timeout untuk prevent hanging
        }
      );
    } catch (tokenError) {
      console.error(
        "Token exchange error:",
        tokenError.response?.data || tokenError.message
      );
      throw new Error("Failed to exchange authorization code");
    }

    const { access_token } = tokenRes.data;

    if (!access_token) {
      throw new Error("No access token received from Google");
    }

    // ✅ PERBAIKAN: Get user profile dengan error handling
    let profileRes;
    try {
      profileRes = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo", // ✅ Gunakan v2 untuk consistency
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
        "Profile fetch error:",
        profileError.response?.data || profileError.message
      );
      throw new Error("Failed to fetch user profile from Google");
    }

    const { id: googleId, email, name, picture: avatar } = profileRes.data;

    // ✅ PERBAIKAN: Validasi email yang comprehensive
    if (!email || typeof email !== "string") {
      throw new Error("Valid email not provided by Google");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ PERBAIKAN: Check authorization dengan error handling
    const allowedEmail = await prisma.accountEmail.findUnique({
      where: { email: normalizedEmail },
    });

    if (!allowedEmail) {
      console.warn(`Unauthorized login attempt: ${normalizedEmail}`);
      return res.redirect(
        `${loginUrl}?error=You+are+not+authorized+to+access+this+system`
      );
    }

    // ✅ PERBAIKAN: User upsert dengan transaction-like consistency
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: name || undefined, // Only update if name exists
        avatar: avatar || undefined,
        googleId,
        provider: "google",
        lastLoginAt: new Date(), // ✅ Track last login
      },
      create: {
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0], // Fallback name
        avatar,
        googleId,
        provider: "google",
        role: "user",
        lastLoginAt: new Date(),
      },
    });

    // ✅ PERBAIKAN: Token generation yang konsisten
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // ✅ PERBAIKAN: Session creation dengan error handling
    let sessionToken;
    try {
      sessionToken = await createUserSession(user, refreshToken, req);
    } catch (sessionError) {
      console.error("Session creation error:", sessionError);
      // Continue without session token but with other cookies
    }

    // ✅ PERBAIKAN: Set cookies dengan approach yang konsisten
    setTokenCookies(res, accessToken, refreshToken);

    // Set session token cookie jika berhasil dibuat
    if (sessionToken) {
      res.cookie("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    // ✅ PERBAIKAN: Success redirect dengan logging
    console.log(`Google login successful for user: ${normalizedEmail}`);
    return res.redirect(successUrl);
  } catch (err) {
    // ✅ PERBAIKAN: Error handling yang structured dan comprehensive
    console.error("--- GOOGLE LOGIN ERROR ---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error type:", err.name);
    console.error("Error message:", err.message);
    console.error("Stack trace:", err.stack);
    console.error("--- END OF ERROR REPORT ---");

    let errorMessage = "An+unexpected+error+occurred.+Please+try+again.";

    // ✅ PERBAIKAN: Error mapping yang lebih specific
    if (err.response?.data?.error === "invalid_grant") {
      errorMessage =
        "Authorization+code+is+invalid+or+expired.+Please+try+logging+in+again.";
    } else if (
      err.message.includes("Email not provided") ||
      err.message.includes("Valid email")
    ) {
      errorMessage = "Failed+to+retrieve+valid+email+from+Google.";
    } else if (err.message.includes("Failed to exchange")) {
      errorMessage = "Authentication+service+unavailable.+Please+try+again.";
    } else if (err.message.includes("Failed to fetch user profile")) {
      errorMessage = "Could+not+retrieve+user+information.+Please+try+again.";
    } else if (err.code === "ECONNABORTED") {
      errorMessage = "Connection+timeout.+Please+try+again.";
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

// 🔹 FUNGSI LAINNYA TETAP SAMA (tidak diubah) 🔹

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.provider !== "credentials") {
      return res.status(403).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(403).json({ error: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create session and set cookies
    const sessionToken = await createUserSession(user, refreshToken, req);
    setAuthCookies(res, refreshToken, sessionToken);

    res.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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
    // 1. Ambil userId dari JWT utama/session
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    // console.log("userId:", userId);

    // 2. Ambil user dan trustedDevices
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaEnabled: true,
        trustedDevices: { select: { deviceId: true } },
      },
    });

    // console.log("User data:", user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 3. Ambil deviceId dari header atau IP
    const deviceId = req.headers["x-device-id"] || req.ip;

    // 1. Ambil trustedDevices (hindari null)
    const trustedDevices = user.trustedDevices || [];

    // 2. Cek apakah device sekarang cocok
    const isKnownDevice = trustedDevices.some(
      (device) => device.deviceId === deviceId
    );

    // 3. Terapkan logika sesuai tabel kamu
    const mfaRequired =
      trustedDevices.length === 0 || // tidak ada trusted device
      (trustedDevices.length > 0 && !isKnownDevice); // ada trusted tapi device tidak cocok
    let tempToken = null;

    // 6. Jika MFA dibutuhkan, generate token
    if (mfaRequired) {
      tempToken = jwt.sign(
        { userId, purpose: "MFA", deviceId },
        MFA_TEMP_SECRET,
        { expiresIn: "5m" }
      );
      // console.log("Generated tempToken:", tempToken);
      // console.log("TempToken will expire at:", expiresAt);
    }

    // 7. Kirimkan respons
    return res.status(200).json({
      mfaRequired,
      mfaEnabled: user.mfaEnabled,
      tempToken,
    });
  } catch (error) {
    console.error("[MFA STATUS ERROR]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const setupMFA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `MyApp (${req.user.email})`,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url || "");

    res.json({
      secret: secret.base32,
      qrCode,
    });
  } catch (err) {
    console.error("[MFA Setup Error]", err);
    res.status(500).json({ error: "Gagal setup MFA" });
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
  const authHeader = req.headers.authorization;

  // Validate token presence
  const tempToken = authHeader?.replace("Bearer ", "").trim();
  if (!tempToken || tempToken === "null") {
    return res.status(400).json({
      error: "Missing verification token",
      solution: "Restart the MFA setup process",
    });
  }

  try {
    // Verify token and validate structure
    const payload = jwt.verify(tempToken, process.env.MFA_TEMP_SECRET);

    // Validate required payload fields
    if (!payload.userId || payload.purpose !== "MFA_VERIFICATION") {
      throw new Error("Invalid token payload structure");
    }

    // Get user with MFA secret
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        mfaSecret: true,
        email: true,
        role: true,
      },
    });

    if (!user?.mfaSecret) {
      return res.status(400).json({
        error: "MFA not configured for this user",
        code: "MFA_NOT_CONFIGURED",
      });
    }

    // Verify OTP
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: otp,
      window: 1,
    });

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid or expired OTP code",
        code: "INVALID_OTP",
      });
    }

    // Handle device remembering
    if (rememberDevice && payload.deviceId) {
      await prisma.trustedDevice.upsert({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId: payload.deviceId,
          },
        },
        create: {
          userId: user.id,
          deviceId: payload.deviceId,
        },
        update: {},
      });
    }

    // Generate final access token
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      accessToken,
    });
  } catch (err) {
    console.error("MFA verification error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Verification session expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid verification token",
        code: "INVALID_TOKEN",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
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
    const userId = req.user.userId;

    // 1. Ambil data user — minimal field
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        provider: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // 2. Cek karyawan berdasarkan email — HANYA ambil userId (tanpa relasi!)
    const existingKaryawan = await prisma.karyawan.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        userId: true, // ← Hanya ini yang penting!
        // TIDAK ambil user: {...} — hemat query & bandwidth
      },
    });

    // 3. Jika ada dan userId null → update
    if (existingKaryawan && existingKaryawan.userId === null) {
      await prisma.karyawan.update({
        where: { id: existingKaryawan.id },
        data: { userId: user.id },
      });

      console.log(
        `✅ Updated karyawan ${existingKaryawan.id} with userId: ${user.id}`
      );

      // ✅ Asumsi update berhasil → update nilai lokal (aman!)
      existingKaryawan.userId = user.id;
    }

    // 4. Kirim response — tanpa duplikasi data, tanpa relasi berat
    return res.status(200).json({
      success: true,
      user: {
        ...user,
        karyawan: existingKaryawan || null, // ← cukup id & userId
      },
    });
  } catch (err) {
    console.error("getProfile error:", err.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};

export const logoutUser = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    // Revoke the session in the database
    await prisma.userSession.updateMany({
      where: { refreshToken: token },
      data: { isRevoked: true },
    });
  }

  // Clear all auth-related cookies
  res.clearCookie("refreshToken", { path: "/" });
  res.clearCookie("session_token", { path: "/" });
  // Also clear the frontend cookie if it exists
  res.clearCookie("accessToken", { path: "/" });

  res.json({ success: true, message: "Logged out successfully" });
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

// export const refreshHandler = async (req, res) => {
//   const token = req.cookies.refreshToken;
//   // console.log("[REFRESH HANDLER] Token:", token);

//   if (!token) {
//     return res.status(401).json({ error: "Refresh token missing" });
//   }

//   try {
//     const payload = jwt.verify(token, JWT_REFRESH_SECRET);

//     const session = await prisma.userSession.findFirst({
//       where: {
//         userId: payload.userId,
//         refreshToken: token,
//         isRevoked: false,
//         expiresAt: { gt: new Date() },
//       },
//     });

//     if (!session) {
//       return res.status(401).json({ error: "Invalid or expired session" });
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: payload.userId },
//     });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // HANYA buat accessToken baru. refreshToken dan session tetap sama.
//     const newAccessToken = generateAccessToken(user);

//     // console.log(
//     //   "[REFRESH HANDLER] Berhasil refresh accessToken:",
//     //   newAccessToken
//     // );

//     return res.status(200).json({ success: true, accessToken: newAccessToken });
//   } catch (err) {
//     console.error("[REFRESH HANDLER] GAGAL TOTAL:", err);
//     return res.status(401).json({ error: "Invalid refresh token." });
//   }
// };
