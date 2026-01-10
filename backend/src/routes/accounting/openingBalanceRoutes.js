import express from "express";
import openingBalanceController from "../../controllers/accounting/openingBalanceController.js";
import { authenticateToken, authorizeAdmin } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getAll", authenticateToken, openingBalanceController.getAll);
router.get("/getById/:id", authenticateToken, openingBalanceController.getById);
router.post("/create", authenticateToken, authorizeAdmin, openingBalanceController.create);
router.put("/update/:id", authenticateToken, authorizeAdmin, openingBalanceController.update);
router.post("/post/:id", authenticateToken, authorizeAdmin, openingBalanceController.post);
router.delete("/delete/:id", authenticateToken, authorizeAdmin, openingBalanceController.delete);

export default router;
