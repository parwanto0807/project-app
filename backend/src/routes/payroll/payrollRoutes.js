import express from "express";
import {
  getAllGaji,
  createGaji,
  getPayrollConfigs,
  createPayrollConfig,
  updatePayrollConfig,
} from "../../controllers/payroll/payrollController.js";

const router = express.Router();

// Gaji
router.get("/gaji", getAllGaji);
router.post("/gaji", createGaji);

// Config
router.get("/config", getPayrollConfigs);
router.post("/config", createPayrollConfig);
router.put("/config/:id", updatePayrollConfig);

export default router;
