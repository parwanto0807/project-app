import express from "express";
import {
  getAllRabs,
  getRabById,
  createRab,
  updateRab,
  updateRabStatus,
  deleteRab,
  getRabsByProject,
} from "../../controllers/rab/rabController.js";

const router = express.Router();

/**
 * @route   GET /api/rabs
 * @desc    Get all RABs with filtering and pagination
 * @access  Private
 */
router.get("/", getAllRabs);

/**
 * @route   GET /api/rabs/project/:projectId
 * @desc    Get all RABs by project ID
 * @access  Private
 */
router.get("/project/:projectId", getRabsByProject);

/**
 * @route   GET /api/rabs/:id
 * @desc    Get RAB by ID with details
 * @access  Private
 */
router.get("/:id", getRabById);

/**
 * @route   POST /api/rabs
 * @desc    Create new RAB
 * @access  Private
 */
router.post("/", createRab);

/**
 * @route   PUT /api/rabs/:id
 * @desc    Update RAB
 * @access  Private
 */
router.put("/:id", updateRab);

/**
 * @route   PATCH /api/rabs/:id/status
 * @desc    Update RAB status
 * @access  Private
 */
router.patch("/:id/status", updateRabStatus);

/**
 * @route   DELETE /api/rabs/:id
 * @desc    Delete RAB
 * @access  Private
 */
router.delete("/:id", deleteRab);

export default router;
