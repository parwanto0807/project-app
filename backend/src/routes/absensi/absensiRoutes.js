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
router.get("/", getAllAbsensi);
router.post("/", createAbsensi);
router.put("/:id", updateAbsensi);
router.delete("/:id", deleteAbsensi);
router.patch("/:id/validate", validateAbsensi);   // Koreksi jam keluar
router.patch("/:id/approve", approveAbsensi);     // Setujui jam keluar apa adanya

/* ----------------------------- USER SUBMISSION ROUTES ----------------------------- */
router.post("/submit-clock-in", upload.single("foto"), submitClockIn);
router.post("/submit-clock-out", upload.single("foto"), submitClockOut);
router.get("/today-status/:userId", getTodayStatus);

export default router;
