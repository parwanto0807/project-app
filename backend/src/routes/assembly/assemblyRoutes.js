import express from "express";
import {
  getAllAssemblies,
  getAssemblyById,
  createAssembly,
  completeAssembly,
  cancelAssembly,
} from "../../controllers/assembly/assemblyController.js";

const router = express.Router();

// Get all assembly orders with filters
router.get("/", getAllAssemblies);

// Get single assembly order
router.get("/:id", getAssemblyById);

// Create new assembly order (DRAFT)
router.post("/", createAssembly);

// Complete assembly (deduct components + add output stock)
router.post("/:id/complete", completeAssembly);

// Cancel assembly (DRAFT only)
router.post("/:id/cancel", cancelAssembly);

export default router;
