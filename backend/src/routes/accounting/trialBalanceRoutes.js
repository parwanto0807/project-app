import express from "express";
import trialBalanceController from "../../controllers/accounting/trialBalanceController.js";
import { authenticateToken, requireRole } from "../../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(["admin"]));

router.get("/", trialBalanceController.getTrialBalance);
router.post("/recalculate", trialBalanceController.recalculate);

export default router;
