import express from "express";
import {
  createSPK,
  getAllSPK,
  getAllSPKPr,
  getSPKById,
  updateSPK,
  deleteSPK,
  getSpkByEmail,
} from "../../controllers/spk/spkController.js";

const router = express.Router();

// CRUD SPK
router.post("/createSPK", createSPK);
router.get("/getAllSPK", getAllSPK);
router.get("/getAllSPKPr", getAllSPKPr);
router.get("/getSpkByEmail", getSpkByEmail);
router.get("/getSPKById/:id", getSPKById);
router.put("/updateSPK/:id", updateSPK);
router.delete("/deleteSPK/:id", deleteSPK);

export default router;
