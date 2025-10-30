import { Router } from "express";
import {
  getAllSessions,
  getActiveSessions,
  revokeSession,
} from "../../controllers/auth/sessionController.js";

const router = Router();

// GET /sessions → semua sesi
router.get("/", getAllSessions);

// GET /sessions/active → sesi masih valid
router.get("/active", getActiveSessions);

// PATCH /sessions/revoke/:id → logout paksa
router.patch("/revoke/:id", revokeSession);

export default router;
