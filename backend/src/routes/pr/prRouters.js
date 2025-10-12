import express from "express";
import PurchaseRequestController from "../../controllers/pr/prController.js";

const router = express.Router();

// GET routes
router.get(
  "/getAllPurchaseRequests",
  PurchaseRequestController.getAllPurchaseRequests
);
router.get(
  "/getPurchaseRequestsByProject/:projectId",
  PurchaseRequestController.getPurchaseRequestsByProject
);

router.post(
  "/getPurchaseRequestBySpkId",
  PurchaseRequestController.getPurchaseRequestBySpkId
);

router.get(
  "/getPurchaseRequestById/:id",
  PurchaseRequestController.getPurchaseRequestById
);

// POST routes
router.post(
  "/createPurchaseRequest",
  PurchaseRequestController.createPurchaseRequest
);

// PUT routes
router.put(
  "/updatePurchaseRequest/:id",
  PurchaseRequestController.updatePurchaseRequest
);
router.put(
  "/updatePurchaseRequestStatus/:id/status",
  PurchaseRequestController.updatePurchaseRequestStatus
);

// DELETE routes
router.delete(
  "/deletePurchaseRequest/:id",
  PurchaseRequestController.deletePurchaseRequest
);

export default router;
