import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import {
  getPreview,
  createDisbursement,
  postDisbursement,
  getAllDisbursements,
  deleteDisbursement,
  voidDisbursement,
  getMyDisbursements,
  getMyDisbursementDetail,
  getDisbursementDetail
} from "../../controllers/payroll/mealAllowanceController.js";

const router = express.Router();

router.use(authenticateToken);

// Mobile / Employee API (harus diletakkan sebelum rute dinamis /preview/:karyawanId)
router.get("/my-allowance", getMyDisbursements);
router.get("/my-allowance/:id", getMyDisbursementDetail);

// Modul Pencairan Uang Makan (HR/Admin only)
router.get("/", getAllDisbursements);
router.get("/preview/:karyawanId", getPreview);
router.get("/detail/:id", getDisbursementDetail);
router.post("/", createDisbursement);
router.post("/:id/post", postDisbursement);
router.post("/:id/void", voidDisbursement);
router.delete("/:id", deleteDisbursement);

export default router;
