import express from 'express';
import { mrController } from '../../controllers/mrInventory/mrController.js';

const router = express.Router();

// Get All MR dengan pagination
router.get('/', mrController.getMRList);

// Create New MR (Triggered after PR Approved)
router.post('/create', mrController.createMR);

// Create Direct MR (Keperluan Kantor Sendiri)
router.post('/create-direct', mrController.createDirectMR);

// Finalize MR (Triggered by QR Code Scan at Warehouse)
router.post('/issue-scan', mrController.issueMR);

// Post Journal for ISSUED MR (WIP Warehouse only)
router.post('/post-journal', mrController.postMRJournal);

// Create MR from PO (Direct Issue Flow)
router.post('/from-po/:poId', mrController.createMRFromPO);

// Bulk Issue all PENDING MRs
router.post('/bulk-issue', mrController.bulkIssue);

// Validate MR for Approval (Check GR completion)
router.get('/validate-approval/:mrId', mrController.validateMRForApproval);

export default router;
