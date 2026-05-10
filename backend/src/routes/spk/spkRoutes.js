import express from "express";
import {
  createSPK,
  getAllSPK,
  getAllSPKPr,
  getSPKById,
  updateSPK,
  deleteSPK,
  getSpkByEmail,
  getAllSPKAdmin,
  getRecentSPK,
  updateSPKProgress,
  updateSPKProgressComment,
  getSPKProgressLogs,
} from "../../controllers/spk/spkController.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

// CRUD SPK
router.post("/createSPK", createSPK);
router.get("/getAllSPK", getAllSPK);
router.get("/getAllSPKAdmin", getAllSPKAdmin);
router.get("/getRecentSPK", getRecentSPK);
router.get("/getAllSPKPr", getAllSPKPr);
router.get("/getSpkByEmail", getSpkByEmail);
router.get("/getSPKById/:id", getSPKById);
router.put("/updateSPK/:id", updateSPK);
router.put("/updateSPKProgress/:id", authenticateToken, updateSPKProgress);
router.put("/updateSPKProgressComment/:id", authenticateToken, updateSPKProgressComment);
router.get("/getSPKProgressLogs/:id", getSPKProgressLogs);
router.delete("/deleteSPK/:id", deleteSPK);

export default router;
