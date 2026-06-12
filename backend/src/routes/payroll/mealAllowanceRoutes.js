import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import {
  getPreview,
  createDisbursement,
  postDisbursement,
  getAllDisbursements,
  deleteDisbursement,
  voidDisbursement
} from "../../controllers/payroll/mealAllowanceController.js";

const router = express.Router();

router.use(authenticateToken);

// Modul Pencairan Uang Makan (HR/Admin only)
router.get("/", getAllDisbursements);
router.get("/preview/:karyawanId", getPreview);
router.post("/", createDisbursement);
router.post("/:id/post", postDisbursement);
router.post("/:id/void", voidDisbursement);
router.delete("/:id", deleteDisbursement);

export default router;
