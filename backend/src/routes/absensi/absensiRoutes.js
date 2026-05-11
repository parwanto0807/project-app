import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getAllAbsensi,
  createAbsensi,
  updateAbsensi,
  deleteAbsensi,
  validateAbsensi,
  approveAbsensi,
} from "../../controllers/absensi/absensiController.js";
import {
  submitClockIn,
  submitClockOut,
  getTodayStatus,
} from "../../controllers/absensi/attendanceSubmissionController.js";
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

/* ----------------------------- ADMIN ROUTES ----------------------------- */
router.get("/", authenticateToken, getAllAbsensi);
router.post("/", authenticateToken, createAbsensi);
router.put("/:id", authenticateToken, updateAbsensi);
router.delete("/:id", authenticateToken, deleteAbsensi);
router.patch("/:id/validate", authenticateToken, validateAbsensi);   // Koreksi jam keluar
router.patch("/:id/approve", authenticateToken, approveAbsensi);     // Setujui jam keluar apa adanya

/* ----------------------------- USER SUBMISSION ROUTES ----------------------------- */
router.post("/submit-clock-in", authenticateToken, upload.single("foto"), submitClockIn);
router.post("/submit-clock-out", authenticateToken, upload.single("foto"), submitClockOut);
router.get("/today-status/:userId", authenticateToken, getTodayStatus);

export default router;
