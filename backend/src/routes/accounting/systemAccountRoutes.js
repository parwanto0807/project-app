import express from "express";
import SystemAccountController from "../../controllers/accounting/systemAccountController.js";

const router = express.Router();

router.get("/", SystemAccountController.getAll);
router.get("/:key", SystemAccountController.getByKey);
router.post("/upsert", SystemAccountController.upsert);
router.put("/:id", SystemAccountController.update);
router.delete("/:id", SystemAccountController.delete);

export default router;
