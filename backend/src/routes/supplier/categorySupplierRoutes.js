import express from "express";
import {
  createSupplierCategory,
  getSupplierCategories,
  getSupplierCategoryById,
  updateSupplierCategory,
  deleteSupplierCategory,
} from "../../controllers/supplier/supplierController.js";

const router = express.Router();

router.get("/", getSupplierCategories);
router.get("/:id", getSupplierCategoryById);
router.post("/", createSupplierCategory);
router.put("/:id", updateSupplierCategory);
router.delete("/:id", deleteSupplierCategory);

export default router;
