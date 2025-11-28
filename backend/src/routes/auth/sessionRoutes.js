import { Router } from "express";
import {
  getAllSessions,
  getActiveSessions,
  revokeSession,
  updateFcmToken,
} from "../../controllers/auth/sessionController.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

const router = Router();

// GET /sessions → semua sesi
router.get("/", authenticateToken, getAllSessions);

// GET /sessions/active → sesi masih valid
router.get("/active", getActiveSessions);

// PATCH /sessions/revoke/:id → logout paksa
router.patch("/revoke/:id", revokeSession);

router.post("/update-session-fcm", authenticateToken, updateFcmToken);

export default router;
