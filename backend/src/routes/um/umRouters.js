import express from "express";
import { uangMukaController } from "../../controllers/um/umController.js";
import {
  uploadBuktiPencairan,
  handleUploadError,
} from "../../utils/umUpload.js";

const router = express.Router();

// GET /uang-muka - Get all uang muka dengan pagination dan filter
router.get("/getAllUangMuka", uangMukaController.getAllUangMuka);

// GET /uang-muka/:id - Get uang muka by ID
router.get("/getUangMukaById/:id", uangMukaController.getUangMukaById);

// POST /uang-muka - Create new uang muka (with optional file upload)
router.post(
  "/createUangMuka",
  uploadBuktiPencairan, // Tambahkan middleware upload untuk create
  handleUploadError,
  uangMukaController.createUangMuka
);

// PUT /uang-muka/:id - Update uang muka
router.put(
  "/updateUangMuka/:id",
  uploadBuktiPencairan, // Tambahkan middleware upload untuk update biasa
  handleUploadError,
  uangMukaController.updateUangMuka
);

// PATCH /uang-muka/:id/status - Update status uang muka (with file upload)
router.post(
  "/updateUangMukaStatus/:id",
  uploadBuktiPencairan,
  handleUploadError,
  uangMukaController.updateUangMukaStatus
);

// DELETE /uang-muka/:id - Delete uang muka
router.delete("/deleteUangMuka/:id", uangMukaController.deleteUangMuka);

// GET /uang-muka/karyawan/:karyawanId - Get uang muka by karyawan
router.get(
  "/getUangMukaByKaryawan/:karyawanId",
  uangMukaController.getUangMukaByKaryawan
);

export default router;
