import express from "express";
import { createImageUpload } from "../../utils/secureUpload.js";
import {
  startKegiatan,
  endKegiatan,
  updateKegiatanDetail,
  getMyKegiatan,
  getAllKegiatan,
  deleteKegiatan,
} from "../../controllers/kegiatan/kegiatanController.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

/* ----------------------------- UPLOAD CONFIG ----------------------------- */
// Foto kegiatan: maks 5 MB, hanya JPG/PNG/WebP.
const upload = createImageUpload("images/attendance", 5, 2);

/* ----------------------------- USER SUBMISSION ----------------------------- */
router.post("/start", authenticateToken, upload.single("foto"), startKegiatan);
router.post("/:id/end", authenticateToken, upload.single("foto"), endKegiatan);
router.post("/:id/detail", authenticateToken, upload.single("foto"), updateKegiatanDetail);
router.get("/my", authenticateToken, getMyKegiatan);

/* ----------------------------- ADMIN ----------------------------- */
router.get("/", authenticateToken, getAllKegiatan);
router.delete("/:id", authenticateToken, deleteKegiatan);

export default router;
