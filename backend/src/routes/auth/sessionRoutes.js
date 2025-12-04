import { Router } from "express";
import {
  getAllSessions,
  getActiveSessions,
  revokeSession,
  updateFcmToken,
  revokeAllOtherSessions,
  getCurrentSession,
} from "../../controllers/auth/sessionController.js";
import { 
  authenticateToken, 
  updateSessionActivity,
  authorizeAdminOrSuper 
} from "../../middleware/authMiddleware.js";

const router = Router();

// ✅ GET /api/sessions → semua sesi user yang sedang login
router.get("/", authenticateToken, updateSessionActivity, getAllSessions);

// ✅ GET /api/sessions/current → session yang sedang aktif (current device)
router.get("/current", authenticateToken, updateSessionActivity, getCurrentSession);

// ✅ GET /api/sessions/active → sesi masih valid (non-revoked)
router.get("/active", authenticateToken, updateSessionActivity, getActiveSessions);

// ✅ PATCH /api/sessions/revoke/:sessionId → revoke session tertentu
router.patch("/revoke/:sessionId", authenticateToken, updateSessionActivity, revokeSession);

// ✅ PATCH /api/sessions/revoke-others → revoke semua session kecuali yang sedang aktif
router.patch("/revoke-others", authenticateToken, updateSessionActivity, revokeAllOtherSessions);

// ✅ POST /api/sessions/fcm → update FCM token untuk session saat ini
router.post("/fcm", authenticateToken, updateSessionActivity, updateFcmToken);

// ✅ ADMIN ONLY: GET /api/sessions/all-users → semua session dari semua users
router.get("/all-users", authenticateToken, authorizeAdminOrSuper, async (req, res) => {
  // Controller logic untuk admin
});

export default router;