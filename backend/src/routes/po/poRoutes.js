import express from 'express';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });
import { 
  getAllPO, 
  getPODetail, 
  updatePO, 
  updatePOStatus, 
  deletePO,
  createPOFromApprovedPR,
  createPO,
  sendPOEmail,
  getPOForExecution,
  submitPurchaseExecution,
  getPOExecutionDetail,
  deletePurchaseExecution,
  updatePurchaseExecution,
  togglePOLineVerification
} from '../../controllers/po/poController.js';

import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// --- Create manually ---
router.post('/', authenticateToken, createPO);

// --- Create from PR ---
router.post('/create-from-pr', async (req, res) => {
  try {
    const { prId } = req.body;
    
    if (!prId) {
      return res.status(400).json({
        success: false,
        error: 'Purchase Request ID is required'
      });
    }

    const po = await createPOFromApprovedPR(prId);
    
    if (!po) {
      return res.status(200).json({
        success: true,
        message: 'No purchase items found in PR, PO not created',
        data: null
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Purchase Order created successfully from approved PR',
      data: po
    });
  } catch (error) {
    console.error('Error creating PO from PR:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create Purchase Order',
      details: error.message
    });
  }
});

// --- Submit Purchase Execution Report ---
router.post('/:poId/execution', authenticateToken, upload.fields([
  { name: 'receiptPhotos', maxCount: 20 },
  { name: 'materialPhotos', maxCount: 20 }
]), submitPurchaseExecution);

// --- Get Execution Detail ---
router.get('/execution/:poLineId', authenticateToken, getPOExecutionDetail);

router.delete('/execution/:executionId', authenticateToken, deletePurchaseExecution);

router.put('/execution/:executionId', authenticateToken, upload.fields([
  { name: 'newReceiptPhotos', maxCount: 10 },
  { name: 'newMaterialPhotos', maxCount: 20 }
]), updatePurchaseExecution);

// --- List & Detail ---
router.get('/execution-list', authenticateToken, getPOForExecution);
router.get('/', getAllPO);
router.get('/:id', getPODetail);

// --- Edit & Action ---
router.put('/:id', updatePO);           // Digunakan untuk edit Draft (isi harga & supplier)
router.patch('/:id/status', updatePOStatus); // Digunakan untuk approval atau pembatalan
router.post('/:id/send-email', authenticateToken, upload.single('file'), sendPOEmail); // Send Email

// --- Delete ---
router.delete('/:id', deletePO);        // Hanya untuk DRAFT

// --- PO Line Verification ---
router.patch('/line/:poLineId/verify', authenticateToken, togglePOLineVerification);

export default router;