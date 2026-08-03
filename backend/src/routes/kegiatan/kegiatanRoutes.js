import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
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

/* ----------------------------- MULTER CONFIG ----------------------------- */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), "public/images/attendance");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/* ----------------------------- USER SUBMISSION ----------------------------- */
router.post("/start", authenticateToken, upload.single("foto"), startKegiatan);
router.post("/:id/end", authenticateToken, upload.single("foto"), endKegiatan);
router.post("/:id/detail", authenticateToken, upload.single("foto"), updateKegiatanDetail);
router.get("/my", authenticateToken, getMyKegiatan);

/* ----------------------------- ADMIN ----------------------------- */
router.get("/", authenticateToken, getAllKegiatan);
router.delete("/:id", authenticateToken, deleteKegiatan);

export default router;
