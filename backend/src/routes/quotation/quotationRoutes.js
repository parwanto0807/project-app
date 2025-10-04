import express from "express";
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  uploadAttachment,
  deleteAttachment,
  addComment,
} from "../../controllers/quotation/quotationController.js";
import { quotationUpload } from "../../utils/uploadDoc.js";

const router = express.Router();

// CRUD Routes
router.post("/createQuotation", createQuotation);
router.get("/getQuotations", getQuotations);
router.get("/getQuotationById:id", getQuotationById);
router.put("/updateQuotation:id", updateQuotation);
router.delete("/deleteQuotation:id", deleteQuotation);

// Status Management
router.patch("/updateQuotationStatus:id/status", updateQuotationStatus);

// Attachment Management
router.post(
  "/uploadAttachment:id/attachments",
  quotationUpload.single("file"),
  uploadAttachment
);
router.delete(
  "/deleteAttachment:id/attachments/:attachmentId",
  deleteAttachment
);

// Comment Management
router.post("/addComment:id/comments", addComment);

export default router;
