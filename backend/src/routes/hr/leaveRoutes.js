import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
} from "../../controllers/hr/leaveController.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

/* ----------------------------- MULTER CONFIG ----------------------------- */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), "public/uploads/leaves");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "LEAVE-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Hanya file gambar, PDF, dan Word yang diperbolehkan!"));
    }
  },
});

/* ------------------------- FLUTTER MOBILE API ------------------------- */
// Apply for leave (supports optional single file attachment "bukti")
router.post("/apply", authenticateToken, upload.single("bukti"), applyLeave);

// Get my leave history
router.get("/my-history", authenticateToken, getMyLeaves);

/* --------------------------- ADMIN DASHBOARD API --------------------------- */
// Get all leaves
router.get("/", authenticateToken, getAllLeaves);

// Approve leaf
router.patch("/:id/approve", authenticateToken, approveLeave);

// Reject leaf
router.patch("/:id/reject", authenticateToken, rejectLeave);

export default router;
