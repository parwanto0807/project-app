import { Router } from "express";
import {
  googleLogin,
  getProfile,
  adminLogin,
  registerAdmin,
  logoutUser,
  adminLoginRegister,
  registerEmail,
  refreshHandler,
  getMFAStatus,
  setupMFA,
  verifyMFA,
  newVerifyMFA,
  getSessions,
  activateMfaSetup,
  completeMfaSetup,
  authMe,
} from "../../controllers/auth/authController.js";

import {
  authenticateToken,
  verifySessionToken,
  checkMFAStatus,
  // authenticateUser, // ❌ HAPUS INI - gunakan authenticateToken saja
} from "../../middleware/authMiddleware.js";
import pkg from "@prisma/client";
const { prisma } = pkg;

const router = Router();

// 🔐 MFA ROUTES
router.get("/mfa/status", authenticateToken, checkMFAStatus, getMFAStatus);
router.get("/sessions", verifySessionToken, getSessions);
router.post("/mfa/activate-setup", authenticateToken, activateMfaSetup);
router.post("/mfa/complete-setup", authenticateToken, completeMfaSetup);
router.get("/mfa/setup", authenticateToken, setupMFA);
router.post("/mfa/verify", verifyMFA);
router.post("/mfa/newVerify", newVerifyMFA);

router.get("/me", authMe);

// 🔐 Google OAuth
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

// ✍️ USER & ADMIN AUTH ROUTES
router.post("/refresh", refreshHandler);

// ✅ FIXED: Gunakan authenticateToken secara konsisten
router.get("/user-login/profile", authenticateToken, getProfile);

router.post("/admin/login", adminLogin);
router.post("/admin/loginAdmin", adminLoginRegister);
router.post("/admin/register", registerAdmin);
router.post("/admin/registerEmail", registerEmail);

// ✅ FIXED: Gunakan authenticateToken bukan authenticateUser
router.post("/logout", authenticateToken, logoutUser);

// 📦 PROTECTED ROUTES
router.get("/sales/sales-order", verifySessionToken, (req, res) => {
  res.json({ message: "Sales order data aman diakses oleh session aktif" });
});

// 🔓 SESSION LOGOUT
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

// routes/auth.js
router.get("/token", authenticateToken, (req, res) => {
  // Return user info, bukan token
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

router.post("/refresh", refreshHandler);

export default router;
