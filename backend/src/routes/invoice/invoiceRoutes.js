import express from "express";
import InvoiceController from "../../controllers/invoice/invoiceController.js";
import { body, param, query } from "express-validator";

const router = express.Router();

// Validation rules
const createInvoiceValidation = [
  body("invoiceDate").isISO8601().notEmpty(),
  body("dueDate").isISO8601().notEmpty(),
  body("currency").isString().optional(),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.name").notEmpty().withMessage("Item name is required"),
  body("items.*.qty")
    .isDecimal({ min: 0.0001 })
    .withMessage("Valid quantity is required"),
  body("items.*.unitPrice")
    .isDecimal({ min: 0 })
    .withMessage("Valid unit price is required"),
  body("items.*.taxRate").isDecimal({ min: 0, max: 100 }).optional(),
];

const updateInvoiceValidation = [
  body("invoiceDate").optional().isISO8601(),
  body("dueDate").optional().isISO8601(),
  body("currency").optional().isString(),
  body("paymentTerm").optional().isString(),
  body("installmentType").optional().isIn(["FULL", "PARTIAL"]),
  body("bankAccountId").optional().isUUID(),

  // Items opsional, tapi kalau dikirim harus array valid
  body("items").optional().isArray(),
  body("items.*.name")
    .optional()
    .notEmpty()
    .withMessage("Item name is required"),
  body("items.*.qty")
    .optional()
    .isDecimal({ min: 0.0001 })
    .withMessage("Valid quantity is required"),
  body("items.*.unitPrice")
    .optional()
    .isDecimal({ min: 0 })
    .withMessage("Valid unit price is required"),
  body("items.*.taxRate").optional().isDecimal({ min: 0, max: 100 }),

  // // Installments opsional
  // body("installments").optional().isArray(),
  // body("installments.*.amount").optional().isDecimal({ min: 0 }),
  // body("installments.*.percentage").optional().isDecimal({ min: 0, max: 100 }),
  // body("installments.*.dueDate").optional().isISO8601(),
];

const updateStatusValidation = [
  param("id").isUUID().withMessage("Invalid invoice ID"),
  body("status").isIn([
    "DRAFT",
    "WAITING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
  ]),
];

const addPaymentValidation = [
  param("id").isUUID().withMessage("Invalid invoice ID"),
  body("payDate").isISO8601().notEmpty(),
  body("amount")
    .isDecimal({ min: 0.01 })
    .withMessage("Valid amount is required"),
  body("method").isIn([
    "TRANSFER",
    "CASH",
    "CREDIT_CARD",
    "VA",
    "E_WALLET",
    "CHEQUE",
  ]),
  body("bankAccountId")
    .isUUID()
    .withMessage("Valid bank account ID is required"),
  body("adminFee")
    .optional()
    .isDecimal({ min: 0 })
    .withMessage("Admin fee must be a positive number"),
  body("reference")
    .notEmpty()
    .withMessage("Payment reference is required"),
  body("skipLedger")
    .optional()
    .isBoolean()
    .withMessage("Skip ledger must be a boolean"),
];

// Public routes
// router.get(
//   "/public/:id",
//   [param("id").isUUID().withMessage("Invalid invoice ID")],
//   InvoiceController.getPublicInvoice
// );

// Protected routes tanpa middleware untuk testing

router.get("/getInvoiceStats", InvoiceController.getInvoiceStats);
router.get("/getInvoiceCount", InvoiceController.getInvoiceCount);
router.get("/getMonthlyInvoice", InvoiceController.getMonthlyInvoice);

router.get(
  "/getInvoices",
  [
    query("page").isInt({ min: 1 }).optional(),
    query("limit").isInt({ min: 1, max: 100 }).optional(),
    query("status").isString().optional(),
    query("startDate").isISO8601().optional(),
    query("endDate").isISO8601().optional(),
  ],
  InvoiceController.getInvoices
);

router.get(
  "/stats",
  [query("year").isInt({ min: 2000, max: 2100 }).optional()],
  InvoiceController.getInvoiceStats
);

router.get(
  "/getInvoiceById/:id",
  [param("id").isUUID().withMessage("Invalid invoice ID")],
  InvoiceController.getInvoiceById
);

router.post(
  "/createInvoice",
  createInvoiceValidation,
  InvoiceController.createInvoice
);

router.put(
  "/updateInvoice/:id",
  updateInvoiceValidation,
  InvoiceController.updateInvoice
);

router.patch(
  "/:id/status",
  updateStatusValidation,
  InvoiceController.updateInvoiceStatus
);

router.post(
  "/addPayment/:id/payments",
  addPaymentValidation,
  InvoiceController.addPayment
);

router.delete(
  "/deleteInvoice/:id",
  [param("id").isUUID().withMessage("Invalid invoice ID")],
  InvoiceController.deleteInvoice
);

// Route khusus untuk approval workflow
// routes/invoiceRoutes.js
router.post(
  "/:id/approve", // ✅ Path yang benar
  [param("id").isUUID().withMessage("Invalid invoice ID")],
  InvoiceController.approveInvoice
);

router.post(
  "/:id/reject",
  [
    param("id").isUUID().withMessage("Invalid invoice ID"),
    body("reason").notEmpty().withMessage("Rejection reason is required"),
  ],
  InvoiceController.rejectInvoice
);

router.post(
  "/:id/post",
  [param("id").isUUID().withMessage("Invalid invoice ID")],
  InvoiceController.postToJournal
);

export default router;
