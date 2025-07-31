import { Router } from "express";
import {
  googleLogin,
  getProfile,
  adminLogin,
  registerAdmin,
  logoutUser,
  refreshToken,
  adminLoginRegister,
  registerEmail,
  refreshTokenHandler,
} from "../../controllers/auth/authController.js";

import { authenticateToken, verifySessionToken, checkMFAStatus } from "../../middleware/authMiddleware.js";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import {
  generateDeviceToken,
  generateSessionToken,
} from "../../utils/tokenGenerator.js";
import pkg from "../../../prisma/generated/prisma/index.js";
const { prisma } = pkg;


const router = Router();

router.get("/sessions", verifySessionToken, async (req, res) => {
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
});


//
// 🔐 GET /mfa/status → untuk tahu apakah user perlu MFA
//
router.get('/mfa/status', authenticateToken, checkMFAStatus, async (req, res) => {
  try {
    // Pastikan user ada
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Dapatkan data user lengkap
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        mfaEnabled: true,
        trustedDevices: {
          where: { userId: req.user.id },
          select: { deviceId: true }
        }
      }
    });
    console.log('[MFA STATUS]', user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Deteksi device baru
    const deviceId = req.headers['x-device-id'] || req.ip;
    const isKnownDevice = user.trustedDevices.some(device => 
      device.deviceId === deviceId
    );

    res.json({ 
      mfaRequired: user.mfaEnabled && !isKnownDevice,
      mfaEnabled: user.mfaEnabled
    });

  } catch (error) {
    console.error('[MFA STATUS ERROR]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//
// 🔐 GET /mfa/setup → Generate secret dan QR code
//
router.get("/mfa/setup", authenticateToken, async (req, res) => {
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
});

//
// 🔐 POST /mfa/verify → Verifikasi OTP + simpan trusted device + session
//
router.post("/mfa/verify", async (req, res) => {
  try {
    const { tempToken, code, rememberDevice } = req.body;

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
      return res.status(401).json({ error: "User tidak ditemukan atau MFA belum aktif" });
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

    // ✅ Session
    const sessionToken = generateSessionToken();
    await prisma.trustedDeviceSession.create({
      data: {
        userId: user.id,
        sessionToken,
        deviceToken: deviceToken || null,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    res.cookie("session_token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("[MFA VERIFY ERROR]", err);
    res.status(500).json({ error: "Verifikasi MFA gagal" });
  }
});

//
// 🔓 POST /logout-session → cabut session_token
//
router.post("/logout-session", async (req, res) => {
  try {
    const cookies = req.cookies || {};
    const sessionToken = cookies["session_token"];

    if (!sessionToken) {
      return res.status(400).json({ error: "Session token tidak ditemukan" });
    }

    await prisma.trustedDeviceSession.updateMany({
      where: { sessionToken },
      data: { isRevoked: true },
    });

    res.clearCookie("session_token", { path: "/" });
    res.clearCookie("trusted_device", { path: "/" });

    res.json({ message: "Logout sukses" });
  } catch (err) {
    console.error("[LOGOUT SESSION ERROR]", err);
    res.status(500).json({ error: "Gagal logout session" });
  }
});

//
// 🔐 Google OAuth Redirect
//
router.get("/google", (req, res) => {
  const redirectUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  redirectUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  redirectUrl.searchParams.set("redirect_uri", process.env.GOOGLE_CALLBACK_URL);
  redirectUrl.searchParams.set("response_type", "code");
  redirectUrl.searchParams.set("scope", "openid email profile");
  redirectUrl.searchParams.set("prompt", "select_account");
  res.redirect(redirectUrl.toString());
});

router.get("/google/callback", googleLogin);

router.get("/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Google authentication failed",
  });
});

//
// ✍️ USER & ADMIN AUTH ROUTES
//
router.post("/refreshToken", refreshToken);
router.get("/refresh-token", refreshTokenHandler);
router.get("/user-login/profile", authenticateToken, getProfile);
router.post("/admin/login", adminLogin);
router.post("/admin/loginAdmin", adminLoginRegister);
router.post("/admin/register", registerAdmin);
router.post("/admin/registerEmail", registerEmail);
router.post("/logout", logoutUser);

//
// 📦 PROTECTED ROUTES EXAMPLE
//
router.get("/sales/sales-order", verifySessionToken, (req, res) => {
  res.json({ message: "Sales order data aman diakses oleh session aktif" });
});

export default router;
