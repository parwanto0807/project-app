import express from "express";
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
  getPayrollConfigs,
  createPayrollConfig,
  updatePayrollConfig,
} from "../../controllers/payroll/payrollController.js";

const router = express.Router();

// Gaji / Slip
router.get("/gaji", getAllGaji);
router.post("/gaji", createGaji);
router.patch("/gaji/:id", updateGaji);
router.delete("/gaji/:id", deleteGaji);
router.post("/gaji/:id/post", postGaji);
router.post("/gaji/:id/void", voidGaji);

// Summary & Preview
router.get("/summary", getPayrollSummary);
router.get("/preview/:karyawanId", getPayrollPreview);

// Bulk
router.get("/bulk-preview", getBulkPayrollPreview);
router.post("/bulk-process", processBulkPayroll);
router.post("/bulk-post", postBulkPayroll);

// Config
router.get("/config", getPayrollConfigs);
router.post("/config", createPayrollConfig);
router.put("/config/:id", updatePayrollConfig);

export default router;
