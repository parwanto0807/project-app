import express from "express";
import {
  getAllPinjaman,
  createPinjaman,
  updatePinjaman,
  deletePinjaman,
  postPinjaman,
  recordManualRepayment,
  getAllKasbon,
  createKasbon,
  updateKasbonStatus,
} from "../../controllers/finance/loanController.js";

const router = express.Router();

// Pinjaman
router.get("/pinjaman", getAllPinjaman);
router.post("/pinjaman", createPinjaman);
router.put("/pinjaman/:id", updatePinjaman);        // Edit (DRAFT only)
router.delete("/pinjaman/:id", deletePinjaman);    // Delete (DRAFT only)
router.post("/pinjaman/:id/post", postPinjaman);
router.post("/pinjaman/repayment/:detailId", recordManualRepayment);

// Kasbon
router.get("/kasbon", getAllKasbon);
router.post("/kasbon", createKasbon);
router.patch("/kasbon/:id/status", updateKasbonStatus);

export default router;
