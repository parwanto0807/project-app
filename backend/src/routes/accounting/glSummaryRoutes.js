import express from "express";
import glSummaryController from "../../controllers/accounting/glSummaryController.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getAll", authenticateToken, glSummaryController.getAll);
router.get("/grand-total", authenticateToken, glSummaryController.getGrandTotal);
router.get("/coa/:coaId", authenticateToken, glSummaryController.getByCoa);

export default router;
