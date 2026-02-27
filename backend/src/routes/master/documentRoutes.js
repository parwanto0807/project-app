import express from "express";
import {
  createDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  getAllDepartments,
  updateDocument,
  getAllEmployees,
} from "../../controllers/master/documentController.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/", createDocument);
router.get("/", getAllDocuments);
router.get("/departments", getAllDepartments);
router.get("/employees", getAllEmployees);
router.get("/:id", getDocumentById);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export default router;
