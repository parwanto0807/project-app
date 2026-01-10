// backend/src/routes/bankRoutes.js
import { Router } from "express";
import { body } from "express-validator";
import { bankController } from "../../../controllers/master/bank/bankController.js";

const router = Router();

// Validation rules
const bankValidation = [
  body("bankName").notEmpty().withMessage("Bank name is required"),
  body("accountNumber").notEmpty().withMessage("Account number is required"),
  body("accountHolder").notEmpty().withMessage("Account holder is required"),
  body("accountCOAId").optional().isUUID().withMessage("Invalid COA ID format"),
];

// CRUD routes
router.post(
  "/createBankAccount/",
  bankValidation,
  bankController.createBankAccount
);
router.get("/getAllBankAccounts/", bankController.getAllBankAccounts);
router.get("/getBankAccountById/:id", bankController.getBankAccountById);
router.put(
  "/updateBankAccount/:id",
  bankValidation,
  bankController.updateBankAccount
);
router.delete("/deleteBankAccount/:id", bankController.deleteBankAccount);

export default router;
