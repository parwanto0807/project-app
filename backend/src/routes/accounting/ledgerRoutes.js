import express from "express";
import ledgerController from "../../controllers/accounting/ledgerController.js";
import { authenticateToken } from "../../middleware/authMiddleware.js"; // Assuming this middleware exists

const router = express.Router();

// Get summary of ledger entries (Headers)
router.get("/", authenticateToken, ledgerController.getLedgers);

// Get specific ledger entry details
router.get("/:id", authenticateToken, ledgerController.getLedgerById);

// Get General Ledger Lines (Detailed view for accounting analysis)
router.get("/general/lines", authenticateToken, ledgerController.getGeneralLedger);

export default router;
