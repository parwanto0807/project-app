import express from "express";
import {
  getAllBAP,
  getBAPById,
  createBAP,
  updateBAP,
  deleteBAP,
  approveBAP,
} from "../../controllers/bap/bapController.js";
import { uploadMultiple } from "../../utils/upload.js";

const router = express.Router();

// Routes
router.get("/getAllBAP", getAllBAP);
router.get("/getBAPById/:id", getBAPById);
router.post("/createBAP",  uploadMultiple.array("photos"), createBAP);
router.put("/updateBAP/:id", updateBAP);
router.delete("/deleteBAP/:id", deleteBAP);
router.patch("/approveBAP/:id/approve", approveBAP);

export default router;
