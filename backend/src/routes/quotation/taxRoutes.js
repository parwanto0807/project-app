import express from "express";
import taxController from "../../controllers/quotation/taxController.js";

const router = express.Router();

router.post("/createTax", taxController.createTax);
router.get("/getTaxes", taxController.getTaxes);
router.get("/getTaxById:id", taxController.getTaxById);
router.put("/updateTax:id", taxController.updateTax);
router.delete("/deleteTax:id", taxController.deleteTax);

export default router;
