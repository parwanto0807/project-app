import express from "express";
import {
  getAllBAP,
  getBAPById,
  createBAP,
  updateBAP,
  deleteBAP,
  approveBAP,
  uploadBAPPhoto,
} from "../../controllers/bap/bapController.js";
import { uploadMultiple, uploadSingle } from "../../utils/upload.js";

const router = express.Router();

// Routes
router.get("/getAllBAP", getAllBAP);
router.get("/getBAPById/:id", getBAPById);
router.post("/createBAP", uploadMultiple.array("photos"), createBAP);
router.put("/updateBAP/:id", uploadMultiple.array("photos"), updateBAP);
router.delete("/deleteBAP/:id", deleteBAP);
router.patch("/approveBAP/:id/approve", approveBAP);
router.post("/uploadBAPPhoto", uploadSingle.single("file"), uploadBAPPhoto);

export default router;
