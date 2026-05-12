import express from "express";
import {
  getAllWifiSsids,
  createWifiSsid,
  updateWifiSsid,
  deleteWifiSsid,
} from "../../../controllers/master/wifi/wifiSsidController.js";
import { authenticateToken, authorizeSuperAdmin } from "../../../middleware/authMiddleware.js";

const router = express.Router();

// Semua user terautentikasi (termasuk mobile) bisa melihat SSID aktif
router.get("/", authenticateToken, getAllWifiSsids);

// Hanya Super Admin yang bisa mengelola (CRUD)
router.post("/", authenticateToken, authorizeSuperAdmin, createWifiSsid);
router.put("/:id", authenticateToken, authorizeSuperAdmin, updateWifiSsid);
router.delete("/:id", authenticateToken, authorizeSuperAdmin, deleteWifiSsid);

export default router;
