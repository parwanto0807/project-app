import express from 'express';
import { 
  getAllPO, 
  getPODetail, 
  updatePO, 
  updatePOStatus, 
  deletePO,
  createPOFromApprovedPR,
  createPO
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

// --- List & Detail ---
router.get('/', getAllPO);
router.get('/:id', getPODetail);

// --- Edit & Action ---
router.put('/:id', updatePO);           // Digunakan untuk edit Draft (isi harga & supplier)
router.patch('/:id/status', updatePOStatus); // Digunakan untuk approval atau pembatalan

// --- Delete ---
router.delete('/:id', deletePO);        // Hanya untuk DRAFT

export default router;