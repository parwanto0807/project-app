import express from "express";
import { createImageUpload } from "../../../utils/secureUpload.js";
import {
  getKaryawanCount,
  getAllKaryawan,
  getKaryawanById,
  createKaryawan,
  updateKaryawan,
  deleteKaryawan,
  getAllGaji,
  getGajiById,
  createGaji,
  updateGaji,
  deleteGaji,
  getAllTeam,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  checkAccountEmail,
  fetchUserByEmail,
  createAccountEmail,
  fetchKaryawanByEmail,
  getKaryawanMe,
} from "../../../controllers/master/karyawan/karyawanController.js";
import { authenticateToken } from "../../../middleware/authMiddleware.js";

const router = express.Router();

/* ----------------------------- UPLOAD CONFIG ----------------------------- */
// Foto karyawan/KTP: maks 5 MB, hanya JPG/PNG/WebP.
const upload = createImageUpload("images/employee", 5, 2);

/* ----------------------------- KARYAWAN ROUTES ----------------------------- */
router.get("/getKaryawanCount", getKaryawanCount);
router.get("/getAllKaryawan", getAllKaryawan);
router.post("/fetchKaryawanByEmail", fetchKaryawanByEmail);
router.get("/getKaryawanById/:id", getKaryawanById);

// ✅ NEW: Get current logged-in employee profile
router.get("/me", authenticateToken, getKaryawanMe);

// ⬇️ contoh: upload single image dengan field name = "foto"
router.post("/createKaryawan", upload.fields([{ name: "foto", maxCount: 1 }, { name: "fotoKtp", maxCount: 1 }]), createKaryawan);
router.put("/updateKaryawan/:id", upload.fields([{ name: "foto", maxCount: 1 }, { name: "fotoKtp", maxCount: 1 }]), updateKaryawan);
router.delete("/deleteKaryawan/:id", deleteKaryawan);

/* ----------------------------- GAJI ROUTES ----------------------------- */
router.get("/getAllGaji", getAllGaji);
router.get("/getGajiById/:id", getGajiById);
router.post("/createGaji", createGaji);
router.put("/updateGaji/:id", updateGaji);
router.delete("/deleteGaji/:id", deleteGaji);

/* ----------------------------- TEAM ROUTES ----------------------------- */
router.get("/getAllTeam", getAllTeam);
router.get("/getTeamById/:id", getTeamById);
router.post("/createTeam", createTeam);
router.put("/updateTeam/:id", updateTeam);
router.delete("/deleteTeam/:id", deleteTeam);

/* ----------------------------- USER ROUTES ----------------------------- */
router.post("/fetchUserByEmail", fetchUserByEmail);
router.post("/checkAccountEmail", checkAccountEmail);
router.post("/createAccountEmail", createAccountEmail);

export default router;
