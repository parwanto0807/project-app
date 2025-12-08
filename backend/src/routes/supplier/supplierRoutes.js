import express from "express";
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  generateSupplierCode,
} from "../../controllers/supplier/supplierController.js";
import { validateSupplier } from "../../validations/supplierValdator.js";

const router = express.Router();

// GET /api/suppliers?activeOnly=true&page=1&limit=10
router.get("/", getSuppliers);

router.get("/generate-code", (req, res) => {
  console.log("🔥 Generate Supplier Code endpoint hit");
  generateSupplierCode(req, res);
});
// GET /api/suppliers/:id
router.get("/:id", getSupplierById);

// POST /api/suppliers (Create)
router.post("/", validateSupplier, createSupplier);

// PUT /api/suppliers/:id (Update)
router.put("/:id", updateSupplier); // Boleh tambahkan validasi jika perlu

// DELETE /api/suppliers/:id (Soft Delete)
router.delete("/:id", deleteSupplier);

export default router;
