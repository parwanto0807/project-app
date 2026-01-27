import express from "express";
import { coaController } from "../../controllers/coa/coaController.js";
import { coaValidation } from "../../validations/coaValidation.js";

const router = express.Router();

// GET ALL COA
router.get("/getAllCOA/", coaValidation.validateGetCOA, coaController.getAllCOA);

// GET COA HIERARCHY
router.get(
  "/hierarchy",
  coaValidation.validateGetCOA,
  coaController.getCOAHierarchy
);

// GET ACCOUNTS WITH BALANCE
router.get("/with-balance", coaValidation.validateGetCOA, coaController.getAccountsWithBalance);


// GET COA BY ID
router.get("/getCOAById:id", coaValidation.validateGetCOAById, coaController.getCOAById);

// CREATE COA
router.post("/createCOA", coaValidation.validateCreateCOA, coaController.createCOA);

// UPDATE COA
router.put("/updateCOA:id", coaValidation.validateUpdateCOA, coaController.updateCOA);

// DELETE COA
router.delete(
  "/deleteCOA:id",
  coaValidation.validateGetCOAById,
  coaController.deleteCOA
);

// DEACTIVATE COA
router.patch(
  "/:id/deactivate",
  coaValidation.validateGetCOAById,
  coaController.deactivateCOA
);

// ACTIVATE COA (tambahan route untuk activate)
router.patch(
  "/:id/activate",
  coaValidation.validateGetCOAById,
  coaController.activateCOA
);

export default router;
