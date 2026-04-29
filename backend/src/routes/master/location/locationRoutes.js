import express from "express";
import {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../../../controllers/master/location/locationController.js";

const router = express.Router();

router.get("/", getAllLocations);
router.post("/", createLocation);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);

export default router;
