import express from 'express';
import { mrController } from '../../controllers/mrInventory/mrController.js';

const router = express.Router();

// Get All MR dengan pagination
router.get('/', mrController.getMRList);

// Create New MR (Triggered after PR Approved)
router.post('/create', mrController.createMR);

// Finalize MR (Triggered by QR Code Scan at Warehouse)
router.post('/issue-scan', mrController.issueMR);

export default router;