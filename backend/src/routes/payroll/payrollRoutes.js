import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import {
  getAllGaji,
  createGaji,
  getPayrollSummary,
  getPayrollPreview,
  getBulkPayrollPreview,
  processBulkPayroll,
  postGaji,
  postBulkPayroll,
  voidGaji,
  deleteGaji,
  updateGaji,
  publishGaji,
  publishBulkPayroll,
  getPayrollConfigs,
  createPayrollConfig,
  updatePayrollConfig,
  getMyGaji,
  getMyGajiDetail,
} from "../../controllers/payroll/payrollController.js";

const router = express.Router();

// Gaji / Slip
router.get("/gaji", getAllGaji);
router.post("/gaji", createGaji);
router.patch("/gaji/:id", updateGaji);
router.delete("/gaji/:id", deleteGaji);
router.post("/gaji/:id/post", postGaji);
router.post("/gaji/:id/void", voidGaji);
router.patch("/gaji/:id/publish", publishGaji);

// Mobile (Karyawan)
router.get("/my-salary", authenticateToken, getMyGaji);
router.get("/my-salary/:id", authenticateToken, getMyGajiDetail);

// Summary & Preview
router.get("/summary", getPayrollSummary);
router.get("/preview/:karyawanId", getPayrollPreview);

// Bulk
router.get("/bulk-preview", getBulkPayrollPreview);
router.post("/bulk-process", processBulkPayroll);
router.post("/bulk-post", postBulkPayroll);
router.post("/bulk-publish", publishBulkPayroll);

// Config
router.get("/config", getPayrollConfigs);
router.post("/config", createPayrollConfig);
router.put("/config/:id", updatePayrollConfig);

export default router;
