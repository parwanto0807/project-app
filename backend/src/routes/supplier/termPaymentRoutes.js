import express from "express";

import {
  getAllTermOfPayments,
  getTermOfPaymentById,
  createTermOfPayment,
  updateTermOfPayment,
  deleteTermOfPayment,
} from "../../controllers/supplier/supplierController.js";

const router = express.Router();

router.get("/", getAllTermOfPayments);
router.get("/:id", getTermOfPaymentById);
router.post("/", createTermOfPayment);
router.put("/:id", updateTermOfPayment);
router.delete("/:id", deleteTermOfPayment);

export default router;
