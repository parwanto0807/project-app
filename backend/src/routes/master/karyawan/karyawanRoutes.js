import express from "express";
import multer from "multer";
import path from "path";

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
} from "../../../controllers/master/karyawan/karyawanController.js";

const router = express.Router();

/* ----------------------------- MULTER CONFIG ----------------------------- */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public/images")); // simpan di public/images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/* ----------------------------- KARYAWAN ROUTES ----------------------------- */
router.get("/getKaryawanCount", getKaryawanCount);
router.get("/getAllKaryawan", getAllKaryawan);
router.get("/getKaryawanById/:id", getKaryawanById);

// ⬇️ contoh: upload single image dengan field name = "foto"
router.post("/createKaryawan", upload.single("foto"), createKaryawan);
router.put("/updateKaryawan/:id", upload.single("foto"), updateKaryawan);
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

export default router;
