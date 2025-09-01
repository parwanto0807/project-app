import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookie from "cookie";
import * as crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

// Asumsi file env.js mengekspor variabel-variabel ini
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  MFA_TEMP_SECRET,
} from "../../config/env.js";

const prisma = new PrismaClient();

const generateAccessToken = (user) => {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "60m",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id, tokenVersion: user.tokenVersion || 0 },
    JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );
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

async function createUserSession(user, refreshToken, req) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    await prisma.userSession.create({
        data: {
            userId: user.id,
            sessionToken,
            refreshToken,
            ipAddress: ipAddress?.toString(),
            userAgent,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
        },
    });
    return sessionToken;
}

export const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await prisma.trustedDeviceSession.findMany({
      where: {
        userId,
        isRevoked: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        deviceToken: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
        isRevoked: true,
      },
    });

    res.json({ sessions });
  } catch (err) {
    console.error("[GET /sessions ERROR]", err);
    res.status(500).json({ error: "Gagal mengambil sesi login" });
  }
};

export const googleLogin = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    // Langkah 1: Tukarkan 'code' dengan 'access_token' (Tidak ada perubahan di sini)
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      })
    );
    const { access_token } = tokenRes.data;

    // Langkah 2: Ambil profil pengguna dari Google (Tidak ada perubahan di sini)
    const profileRes = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    const { id: googleId, email, name, picture: avatar } = profileRes.data;

    if (!email) {
      throw new Error("Email not provided by Google");
    }

    // Langkah 3: Verifikasi apakah email terdaftar sebagai admin
    const userEmail = await prisma.accountEmail.findUnique({
      where: { email },
    });

    if (!userEmail) {
      // Jika email tidak ada di whitelist, kembalikan ke halaman login
      return res.redirect("http://localhost:3000/auth/loginAdmin");
    }

    // Langkah 4: Gunakan 'upsert' untuk membuat atau memperbarui pengguna
    const user = await prisma.user.upsert({
      where: { email }, // Kriteria pencarian
      update: {
        // Data yang diperbarui jika pengguna sudah ada
        name,
        avatar,
        googleId,
        provider: "google",
      },
      create: {
        // Data yang dibuat jika pengguna baru
        email,
        name,
        avatar,
        googleId,
        provider: "google",
        role: "admin", // <-- PERBAIKAN: Tetapkan role default untuk pengguna baru
        // Pastikan Anda menggunakan nama role yang sesuai (misal: "ADMIN", "SUPER_ADMIN")
      },
    });

    // Langkah 5: Buat sesi dan cookies (Tidak ada perubahan di sini)
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await createUserSession(user, refreshToken, req);
    setTokenCookies(res, accessToken, refreshToken);

    res.redirect("http://localhost:3000/admin-area");
  } catch (err) {
    console.error("Google login error:", err.response?.data || err.message);
    const errorMessage =
      err.response?.data?.error === "invalid_grant"
        ? "Authorization code is invalid or expired. Please try again."
        : "Google login failed";
    res.status(400).json({ success: false, error: errorMessage });
  }
};

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
    // req.user is attached by the authenticateToken middleware
    const userId = req.user.userId;

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
    return res.status(200).json({ success: true, user });
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
  console.log("[REFRESH HANDLER] Token:", token);

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

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // HANYA buat accessToken baru. refreshToken dan session tetap sama.
    const newAccessToken = generateAccessToken(user);
    
    console.log("[REFRESH HANDLER] Berhasil refresh accessToken:", newAccessToken);

    return res.status(200).json({ success: true, accessToken: newAccessToken });
    

  } catch (err) {
    console.error("[REFRESH HANDLER] GAGAL TOTAL:", err);
    return res.status(401).json({ error: "Invalid refresh token." });
  }
};

// export const refreshHandler = async (req, res) => {
//   const token = req.cookies.refreshToken;

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

//     const user = await prisma.user.findUnique({ where: { id: payload.userId } });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Token Rotation
//     const newAccessToken = generateAccessToken(user);
//     const newRefreshToken = generateRefreshToken(user);
//     const newSessionToken = crypto.randomBytes(32).toString('hex');

//     await prisma.$transaction([
//       prisma.userSession.update({
//         where: { id: session.id },
//         data: { 
//           isRevoked: true,
//           sessionToken: session.sessionToken,
//           // PERBAIKAN: Sertakan ipAddress yang ada untuk memenuhi persyaratan skema
//           ipAddress: session.ipAddress,
//         },
//       }),
//       prisma.userSession.create({
//         data: {
//           userId: user.id,
//           refreshToken: newRefreshToken,
//           sessionToken: newSessionToken,
//           // Ambil IP address baru dari request saat ini untuk sesi baru
//           ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
//           userAgent: req.headers["user-agent"],
//           expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//         },
//       }),
//     ]);
    
//     setAuthCookies(res, newRefreshToken, newSessionToken);

//     return res.status(200).json({ success: true, accessToken: newAccessToken });

//   } catch (err) {
//     console.error("[REFRESH HANDLER] GAGAL TOTAL:", err);
//     return res.status(401).json({ error: "Invalid refresh token or failed to process session." });
//   }
// };
