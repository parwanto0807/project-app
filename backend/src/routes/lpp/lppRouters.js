import express from "express";
import { lppController } from "../../controllers/lpp/lppController.js";
import { uploadLpp, handleLppUploadError } from "../../utils/lppUpload.js";

const router = express.Router();

// ✅ Create LPP + Upload foto bukti langsung
router.post(
  "/createLpp",
  uploadLpp.array("fotoBukti", 5), // terima max 5 foto
  handleLppUploadError,
  lppController.createLpp
);
router.post(
  "/:id/details/:detailId/upload-foto",
  uploadLpp.array("fotoBukti", 5), // terima max 5 foto
  handleLppUploadError,
  lppController.uploadFotoBukti
);

router.get("/getAllLpp", lppController.getAllLpp);
router.get("/getLppById/:id", lppController.getLppById);
router.put("/updateLpp/:id", lppController.updateLpp);
router.delete("/deleteLpp/:id", lppController.deleteLpp);
router.patch("/updateStatus/:id/status", lppController.updateStatus);

export default router;
