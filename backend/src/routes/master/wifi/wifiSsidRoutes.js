import express from "express";
import {
  getAllWifiSsids,
  createWifiSsid,
  updateWifiSsid,
  deleteWifiSsid,
} from "../../../controllers/master/wifi/wifiSsidController.js";
import { authenticateToken, authorizeSuperAdmin } from "../../../middleware/authMiddleware.js";

const router = express.Router();

// Semua user bisa melihat SSID aktif (biasanya diproteksi di level aplikasi/middleware frontend)
router.get("/", getAllWifiSsids);

// Endpoint management
router.post("/", createWifiSsid);
router.put("/:id", updateWifiSsid);
router.delete("/:id", deleteWifiSsid);


export default router;
