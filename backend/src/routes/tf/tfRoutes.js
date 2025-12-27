import express from 'express';
import {
  createTransfer,
  getAllTransfers,
  getTransferById,
  updateTransferStatus,
  cancelTransfer,
  createTransferGR
} from '../../controllers/tf/tfController.js';

const router = express.Router();

// Create new transfer
router.post('/', createTransfer);

// Get all transfers with filters
router.get('/', getAllTransfers);

// Get single transfer
router.get('/:id', getTransferById);

// Update transfer status
router.patch('/:id/status', updateTransferStatus);

// Cancel transfer
router.delete('/:id', cancelTransfer);

// Create GR manually
router.post('/:id/create-gr', createTransferGR);

export default router;
