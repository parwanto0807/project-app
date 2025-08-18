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
  refreshTokenHandlerJson,
  getMFAStatus,
  setupMFA,
  verifyMFA,
  newVerifyMFA,
  getSessions,
  activateMfaSetup,
  completeMfaSetup
} from "../../controllers/auth/authController.js";

import {
  authenticateToken,
  verifySessionToken,
  checkMFAStatus,
} from "../../middleware/authMiddleware.js";
import pkg from "../../../prisma/generated/prisma/index.js";
const { prisma } = pkg;

const router = Router();

// 🔐 GET /mfa/status → untuk tahu apakah user perlu MFA
router.get("/mfa/status",authenticateToken,checkMFAStatus,getMFAStatus);
router.get("/sessions", verifySessionToken, getSessions);
router.post('/mfa/activate-setup',authenticateToken, activateMfaSetup);
router.post("/mfa/complete-setup",authenticateToken, completeMfaSetup);
router.get("/mfa/setup", authenticateToken, setupMFA);
router.post("/mfa/verify", verifyMFA);
router.post("/mfa/newVerify", newVerifyMFA);

// 🔐 Google OAuth Redirect
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
router.post("/refresh", refreshTokenHandlerJson);
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
export default router;
