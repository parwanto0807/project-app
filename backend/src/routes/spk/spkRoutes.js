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
  updateSPKProgress,
} from "../../controllers/spk/spkController.js";

const router = express.Router();

// CRUD SPK
router.post("/createSPK", createSPK);
router.get("/getAllSPK", getAllSPK);
router.get("/getAllSPKAdmin", getAllSPKAdmin);
router.get("/getAllSPKPr", getAllSPKPr);
router.get("/getSpkByEmail", getSpkByEmail);
router.get("/getSPKById/:id", getSPKById);
router.put("/updateSPK/:id", updateSPK);
router.put("/updateSPKProgress/:id", updateSPKProgress);
router.delete("/deleteSPK/:id", deleteSPK);

export default router;
