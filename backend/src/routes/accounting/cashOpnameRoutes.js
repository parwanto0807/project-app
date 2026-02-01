import express from "express";
import cashOpnameController from "../../controllers/accounting/cashOpnameController.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", cashOpnameController.getOpnames);
router.post("/", cashOpnameController.createOpname);
router.get("/balance", cashOpnameController.getSystemBalance);

export default router;
