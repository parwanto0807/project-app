import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookie from "cookie";
import {
  JWT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
} from "../../config/env.js";
import { randomUUID } from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { generateDeviceToken } from "../../utils/tokenGenerator.js";

const prisma = new PrismaClient();

// 🔐 Helper: Buat token JWT
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// 🔐 Helper: Set cookie JWT
function setTokenCookies(res, accessToken, refreshToken) {
  const maxAgeAccessToken = 60 * 15 * 1000; // 15 menit dalam ms
  const maxAgeRefreshToken = 60 * 60 * 24 * 7 * 1000; // 7 hari dalam ms

  res.setHeader("Set-Cookie", [
    cookie.serialize("accessToken", accessToken, {
      httpOnly: true,
      maxAge: maxAgeAccessToken / 1000, // detik
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    }),
    cookie.serialize("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: maxAgeRefreshToken / 1000, // detik
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    }),
  ]);

  // Hitung waktu sekarang dan waktu kedaluwarsa berdasarkan maxAge
  const now = new Date();
  const accessTokenExpiresAt = new Date(now.getTime() + maxAgeAccessToken);

  console.log(
    "🔁 Refresh berhasil pada:",
    now.toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "long",
    })
  );
  console.log(
    "🔐 accessToken berlaku sampai:",
    accessTokenExpiresAt.toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "long",
    })
  );
}

async function createUserSession(user, refreshToken, req) {
  const sessionToken = randomUUID(); // UUID token untuk session (bisa juga disimpan di cookie kalau mau)
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  await prisma.userSession.create({
    data: {
      userId: user.id,
      sessionToken,
      refreshToken, // bisa disimpan langsung atau versi hash
      ipAddress: ipAddress?.toString(),
      userAgent,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 hari
    },
  });

  return sessionToken;
}

// Handler untuk GET /sessions
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

// 🔁 Google OAuth Login
export const googleLogin = async (req, res) => {
  const { code } = req.query;

  if (!code)
    return res.status(400).json({ error: "Authorization code is required" });

  try {
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token } = tokenRes.data;

    const profileRes = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const { id: googleId, email, name, picture: avatar } = profileRes.data;

    if (!email) throw new Error("Email not provided by Google");

    const user = await prisma.user.findUnique({
      where: { email },
    });
    const userEmail = await prisma.accountEmail.findUnique({
      where: { email },
    });

    if (!userEmail) {
      // Jika email belum terdaftar, redirect ke halaman pendaftaran admin
      return res.redirect("http://localhost:3000/auth/loginAdmin");
    }

    // Optional: update user info
    await prisma.user.update({
      where: { email },
      data: { name, avatar, provider: "google", googleId },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await createUserSession(user, refreshToken, req);
    setTokenCookies(res, accessToken, refreshToken);

    res.redirect("http://localhost:3000/admin-area"); // Redirect ke area admin setelah login sukses
  } catch (err) {
    console.error("Google login error:", err.response?.data || err.message);
    const errorMessage =
      err.response?.data?.error === "invalid_grant"
        ? "Authorization code is invalid or expired. Please try again."
        : "Google login failed";
    res.status(400).json({ success: false, error: errorMessage });
  }
};

// 🔐 Login Admin
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validasi input dasar
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // 2. Cari user dengan role 'super'
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        provider: true,
        mfaEnabled: true,
        active: true,
      },
    });

    // 3. Validasi user
    if (!user) {
      return res.status(403).json({ error: "Invalid credentials" });
    }

    if (user.role !== "super" || user.provider !== "credentials") {
      return res
        .status(403)
        .json({ error: "Access restricted to super admins only" });
    }

    if (!user.active) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    // 4. Verifikasi password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Log percobaan login gagal
      await prisma.loginAttempt.create({
        data: {
          userId: user.id,
          status: "FAILED",
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          email: user.email,
        },
      });
      return res.status(403).json({ error: "Invalid credentials" });
    }

    // 5. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 6. Buat session dan set cookies
    await createUserSession(user, refreshToken, req);
    setTokenCookies(res, accessToken, refreshToken);

    // 7. Log login sukses
    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        status: "SUCCESS",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        email: user.email,
      },
    });

    // 8. Response
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
      accessToken,
      // Kirim refreshToken hanya jika diperlukan (biasanya cukup di cookie)
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMFAStatus = async (req, res) => {
  try {
    // Handle both JWT token (userId) and session token (id)
    const userId = req.user?.userId || req.user?.id;
    console.log("[MFA USER CONTROLLER ON ROUTER 1]", userId);

    // Pastikan user ada
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Dapatkan data user lengkap
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaEnabled: true,
        trustedDevices: {
          where: { userId: userId },
          select: { deviceId: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Deteksi device baru
    const deviceId = req.headers["x-device-id"] || req.ip;
    const isKnownDevice = user.trustedDevices.some(
      (device) => device.deviceId === deviceId
    );

    res.json({
      mfaRequired: user.mfaEnabled && !isKnownDevice,
      mfaEnabled: user.mfaEnabled,
    });
  } catch (error) {
    console.error("[MFA STATUS ERROR]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// -- SETUP MFA: Generate Secret & QR Code --
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

// -- VERIFY MFA: Verifikasi OTP, Simpan Trusted Device --
export const verifyMFA = async (req, res) => {
  try {
    const { tempToken, code, rememberDevice } = req.body;

    console.log("[MFA VERIFY BODY]", req.body);

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

// Fungsi untuk validasi email sederhana
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

// 📝 Register Admin
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

// 👤 Get Profile
export const getProfile = async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.accessToken;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized - Token missing" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }
};

// 🔁 Refresh Token
export const refreshToken = async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.refreshToken;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "Refresh token missing" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    setTokenCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (err) {
    console.error("refreshToken error:", err.message);
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }
};

// 🔓 Logout
export const logoutUser = (req, res) => {
  res.setHeader("Set-Cookie", [
    cookie.serialize("accessToken", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    }),
    cookie.serialize("refreshToken", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    }),
  ]);

  res.json({ success: true, message: "Logged out successfully" });
};

export const refreshTokenHandler = async (req, res) => {
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const token = cookies.refreshToken;
  const referer = req.headers.referer;

  if (!token) return res.status(401).json({ error: "Refresh token missing" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const session = await prisma.userSession.findFirst({
      where: {
        userId: payload.userId,
        refreshToken: token,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session)
      return res.status(401).json({ error: "Invalid or expired session" });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const newAccessToken = generateAccessToken(user);
    setTokenCookies(res, newAccessToken, token); // gunakan refreshToken lama
    const defaultFrontendUrl =
      process.env.FRONTEND_URL || "http://localhost:3000";
    let redirectUrl = `${defaultFrontendUrl}/dashboard`; // Default fallback

    if (req.query.redirect) {
      try {
        const decodedUrl = decodeURIComponent(req.query.redirect);
        const parsedUrl = new URL(decodedUrl);

        // Validasi hanya mengizinkan redirect ke domain frontend
        if (parsedUrl.origin === defaultFrontendUrl) {
          redirectUrl = decodedUrl;
        }
      } catch (e) {
        console.warn("Invalid redirect URL:", req.query.redirect);
      }
    }

    // Set cookies
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 900000, // 5 menit
      path: "/",
    });

    // Lakukan redirect
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};
