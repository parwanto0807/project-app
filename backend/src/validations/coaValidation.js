import { body, param, query } from "express-validator";

export const coaValidation = {
  // Validation for GET COA
  validateGetCOA: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Limit must be between 1 and 1000"),
    query("search")
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage("Search term must be less than 100 characters"),
    query("type")
      .optional()
      .isIn(["ASET", "LIABILITAS", "EKUITAS", "PENDAPATAN", "HPP", "BEBAN"])
      .withMessage("Invalid COA type"),
    query("status")
      .optional()
      .isIn(["ACTIVE", "INACTIVE", "LOCKED"])
      .withMessage("Invalid COA status"),
    query("postingType")
      .optional()
      .isIn(["HEADER", "POSTING"])
      .withMessage("Invalid posting type"),
  ],

  // Validation for GET COA by ID
  validateGetCOAById: [
    param("id").isUUID().withMessage("Invalid COA ID format"),
  ],

  // Validation for CREATE COA
  validateCreateCOA: [
    body("code")
      .notEmpty()
      .withMessage("COA code is required")
      .isString()
      .isLength({ min: 1, max: 1000 })
      .withMessage("COA code must be between 1 and 1000 characters")
      .matches(/^[A-Z0-9.\-]+$/)
      .withMessage(
        "COA code can only contain uppercase letters, numbers, dots, and hyphens"
      ),

    body("name")
      .notEmpty()
      .withMessage("COA name is required")
      .isString()
      .isLength({ min: 2, max: 100 })
      .withMessage("COA name must be between 2 and 100 characters"),

    body("description")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),

    body("type")
      .notEmpty()
      .withMessage("COA type is required")
      .isIn(["ASET", "LIABILITAS", "EKUITAS", "PENDAPATAN", "HPP", "BEBAN"])
      .withMessage("Invalid COA type"),

    body("normalBalance")
      .notEmpty()
      .withMessage("Normal balance is required")
      .isIn(["DEBIT", "CREDIT"])
      .withMessage("Normal balance must be DEBIT or CREDIT"),

    body("postingType")
      .optional()
      .isIn(["HEADER", "POSTING"])
      .withMessage("Invalid posting type"),

    body("cashflowType")
      .optional()
      .isIn(["OPERATING", "INVESTING", "FINANCING", "NONE"])
      .withMessage("Invalid cashflow type"),

    body("status")
      .optional()
      .isIn(["ACTIVE", "INACTIVE", "LOCKED"])
      .withMessage("Invalid COA status"),

    body("isReconcilable")
      .optional()
      .isBoolean()
      .withMessage("isReconcilable must be a boolean"),

    body("defaultCurrency")
      .optional()
      .isString()
      .isLength({ min: 3, max: 3 })
      .withMessage("Default currency must be 3 characters (e.g., IDR)"),

    body("parentId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage("Invalid parent ID format"),

    body("taxRateId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage("Invalid tax rate ID format"),

    // Custom validation for business rules
    body().custom((value, { req }) => {
      const { type, normalBalance, postingType } = req.body;

      // Validate normal balance based on account type
      const debitAccounts = ["ASET", "BEBAN", "HPP"];
      const creditAccounts = ["LIABILITAS", "EKUITAS", "PENDAPATAN"];

      if (debitAccounts.includes(type) && normalBalance !== "DEBIT") {
        throw new Error(`${type} accounts must have DEBIT normal balance`);
      }

      if (creditAccounts.includes(type) && normalBalance !== "CREDIT") {
        throw new Error(`${type} accounts must have CREDIT normal balance`);
      }

      // HEADER accounts cannot be reconcilable
      if (postingType === "HEADER" && value.isReconcilable) {
        throw new Error("HEADER accounts cannot be reconcilable");
      }

      return true;
    }),
  ],

  // Validation for UPDATE COA
  validateUpdateCOA: [
    param("id").isUUID().withMessage("Invalid COA ID format"),

    body("code")
      .optional()
      .isString()
      .isLength({ min: 2, max: 20 })
      .withMessage("COA code must be between 2 and 20 characters")
      .matches(/^[A-Z0-9.\-]+$/)
      .withMessage(
        "COA code can only contain uppercase letters, numbers, dots, and hyphens"
      ),

    body("name")
      .optional()
      .isString()
      .isLength({ min: 2, max: 100 })
      .withMessage("COA name must be between 2 and 100 characters"),

    body("description")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),

    body("type")
      .optional()
      .isIn(["ASET", "LIABILITAS", "EKUITAS", "PENDAPATAN", "HPP", "BEBAN"])
      .withMessage("Invalid COA type"),

    body("normalBalance")
      .optional()
      .isIn(["DEBIT", "CREDIT"])
      .withMessage("Normal balance must be DEBIT or CREDIT"),

    body("postingType")
      .optional()
      .isIn(["HEADER", "POSTING"])
      .withMessage("Invalid posting type"),

    body("cashflowType")
      .optional()
      .isIn(["OPERATING", "INVESTING", "FINANCING", "NONE"])
      .withMessage("Invalid cashflow type"),

    body("status")
      .optional()
      .isIn(["ACTIVE", "INACTIVE", "LOCKED"])
      .withMessage("Invalid COA status"),

    body("isReconcilable")
      .optional()
      .isBoolean()
      .withMessage("isReconcilable must be a boolean"),

    body("defaultCurrency")
      .optional()
      .isString()
      .isLength({ min: 3, max: 3 })
      .withMessage("Default currency must be 3 characters (e.g., IDR)"),

    body("parentId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage("Invalid parent ID format"),

    body("taxRateId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage("Invalid tax rate ID format"),

    // Custom validation for business rules
    body().custom((value, { req }) => {
      const { type, normalBalance, postingType, isReconcilable } = req.body;

      // Validate normal balance based on account type if both are provided
      if (type && normalBalance) {
        const debitAccounts = ["ASET", "BEBAN", "HPP"];
        const creditAccounts = ["LIABILITAS", "EKUITAS", "PENDAPATAN"];

        if (debitAccounts.includes(type) && normalBalance !== "DEBIT") {
          throw new Error(`${type} accounts must have DEBIT normal balance`);
        }

        if (creditAccounts.includes(type) && normalBalance !== "CREDIT") {
          throw new Error(`${type} accounts must have CREDIT normal balance`);
        }
      }

      // HEADER accounts cannot be reconcilable
      if (postingType === "HEADER" && isReconcilable) {
        throw new Error("HEADER accounts cannot be reconcilable");
      }

      return true;
    }),
  ],
};
