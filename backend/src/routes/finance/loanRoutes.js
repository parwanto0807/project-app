import express from "express";
import {
  getAllPinjaman,
  createPinjaman,
  getAllKasbon,
  createKasbon,
  updateKasbonStatus,
} from "../../controllers/finance/loanController.js";

const router = express.Router();

// Pinjaman
router.get("/pinjaman", getAllPinjaman);
router.post("/pinjaman", createPinjaman);

// Kasbon
router.get("/kasbon", getAllKasbon);
router.post("/kasbon", createKasbon);
router.patch("/kasbon/:id/status", updateKasbonStatus);

export default router;
