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
  updateKasbon,
  approveKasbon,
  postKasbon,
  rejectKasbon,
  settleKasbon,
  deleteKasbon,
  updateKasbonStatus,
} from "../../controllers/finance/loanController.js";

const router = express.Router();

// Pinjaman
router.get("/pinjaman", getAllPinjaman);
router.post("/pinjaman", createPinjaman);
router.put("/pinjaman/:id", updatePinjaman);
router.delete("/pinjaman/:id", deletePinjaman);
router.post("/pinjaman/:id/post", postPinjaman);
router.post("/pinjaman/repayment/:detailId", recordManualRepayment);

// Kasbon
router.get("/kasbon", getAllKasbon);
router.post("/kasbon", createKasbon);
router.put("/kasbon/:id", updateKasbon);              // Edit (PENDING only)
router.patch("/kasbon/:id/approve", approveKasbon);
router.post("/kasbon/:id/post", postKasbon);
router.patch("/kasbon/:id/reject", rejectKasbon);     // PENDING or APPROVED (not posted)
router.patch("/kasbon/:id/settle", settleKasbon);
router.delete("/kasbon/:id", deleteKasbon);           // PENDING only
router.patch("/kasbon/:id/status", updateKasbonStatus); // legacy

export default router;
