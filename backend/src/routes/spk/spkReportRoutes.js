// /backend/routes/spkReportRouter.js
import express from "express";
import { uploadMultiple } from "../../utils/upload.js";
import {
  createSpkFieldReport,
  getReportsBySpkId,
  getReportById,
  updateReportStatus,
  deleteReport,
  addPhotosToReport,
  getSPKFieldReports,
  getReportsBySpkIdBap,
} from "../../controllers/spk/spkReportController.js";

const router = express.Router();

router.post(
  "/createSpkFieldReport",
  uploadMultiple.array("photos"),
  createSpkFieldReport
);
router.get("/getSPKFieldReports", getSPKFieldReports); // 👈 Ini yang kita buat!
router.get("/getReportsBySpkId/:spkId", getReportsBySpkId);
router.get("/getReportsBySpkIdBap/:spkId", getReportsBySpkIdBap);
router.get("/getReportById/:id", getReportById);
router.put("/updateReportStatus/:id/status", updateReportStatus);
router.delete("/deleteReport/:id", deleteReport);
router.post(
  "/addPhotosToReport/:id/photos",
  uploadMultiple.array("photos"),
  addPhotosToReport
);

export default router;
