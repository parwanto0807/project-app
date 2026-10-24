import express from "express";
import { createImageUpload } from "../../utils/secureUpload.js";
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
  getMyHistory,
  getTodayAttendance,
  reportForgottenOut,
} from "../../controllers/absensi/attendanceSubmissionController.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

/* ----------------------------- UPLOAD CONFIG ----------------------------- */
// Foto absensi: maks 5 MB, hanya JPG/PNG/WebP.
const upload = createImageUpload("images/attendance", 5, 2);

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
router.get("/my-history", authenticateToken, getMyHistory);
router.get("/today", authenticateToken, getTodayAttendance);
router.get("/today-status/:userId", authenticateToken, getTodayStatus);
router.post("/report-forgotten-out", authenticateToken, reportForgottenOut);

export default router;
