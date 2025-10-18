// src/routes/lpp/lppRouters.js
import express from "express";
import { lppController } from "../../controllers/lpp/lppController.js";
import { uploadLpp, handleLppUploadError } from "../../utils/lppUpload.js";

const router = express.Router();

// ✅ Create LPP + Upload foto bukti langsung
router.post(
  "/createLpp",
  uploadLpp.array("fotoBukti", 5),
  handleLppUploadError,
  lppController.createLpp
);

// ✅ Get All LPP
router.get("/getAllLpp", lppController.getAllLpp);

// ✅ Get LPP by ID
router.get("/getLppById/:id", lppController.getLppById);

// ✅ Update LPP Header (data utama)
router.put("/updateLpp/:id", lppController.updateLpp);

// ✅ Update Status LPP
router.patch("/updateStatus/:id/status", lppController.updateStatus);

// ✅ Delete LPP
router.delete("/deleteLpp/:id", lppController.deleteLpp);

// 🆕 DETAIL OPERATIONS - CRUD untuk detail LPP

// ✅ Create New Detail untuk LPP yang sudah ada
router.post(
  "/:id/details",
  uploadLpp.array("fotoBukti", 5),
  handleLppUploadError,
  lppController.createLppDetail
);

// ✅ Update Existing Detail
router.put(
  "/details/:detailId",
  uploadLpp.array("fotoBukti", 5),
  handleLppUploadError,
  lppController.updateLppDetail
);

// ✅ Delete Detail
router.delete("/details/:detailId", lppController.deleteLppDetail);

// ✅ Batch Update Details (Create, Update, Delete sekaligus)
router.put("/:id/details/batch", lppController.batchUpdateDetails);

// 🆕 FOTO BUKTI OPERATIONS

// ✅ Upload foto untuk detail tertentu
router.post(
  "/:id/details/:detailId/upload-foto",
  uploadLpp.array("fotoBukti", 5),
  handleLppUploadError,
  lppController.uploadFotoBukti
);

// ✅ Delete foto bukti
router.delete("/foto-bukti/:fotoId", lppController.deleteFotoBukti);

// ✅ Update keterangan foto
router.patch("/foto-bukti/:fotoId", lppController.updateFotoKeterangan);

// 🆕 ADVANCED OPERATIONS

// ✅ Get LPP by Purchase Request ID
router.get("/by-purchase-request/:purchaseRequestId", lppController.getLppByPurchaseRequestId);

// ✅ Duplicate LPP (buat salinan)
router.post("/:id/duplicate", lppController.duplicateLpp);

// ✅ Export LPP sebagai PDF/Excel
router.get("/:id/export/pdf", lppController.exportLppToPdf);
router.get("/:id/export/excel", lppController.exportLppToExcel);

// ✅ Get LPP Statistics
router.get("/statistics/overview", lppController.getLppStatistics);

export default router;