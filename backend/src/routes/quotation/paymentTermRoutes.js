import express from "express";
import paymentTermController from "../../controllers/quotation/paymentTermController.js";

const router = express.Router();

router.post("/createPaymentTerm", paymentTermController.createPaymentTerm);
router.get("/getPaymentTerms", paymentTermController.getPaymentTerms);
router.get("/getPaymentTermById:id", paymentTermController.getPaymentTermById);
router.put("/updatePaymentTerm:id", paymentTermController.updatePaymentTerm);
router.delete("/deletePaymentTerm:id", paymentTermController.deletePaymentTerm);

export default router;
