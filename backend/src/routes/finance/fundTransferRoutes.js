import express from 'express';
import FundTransferController from '../../controllers/finance/fundTransferController.js';
import { authenticateToken } from '../../middleware/authMiddleware.js'; // Pastikan middleware ada

const router = express.Router();

router.get('/', authenticateToken, FundTransferController.getTransfers);
router.get('/:id', authenticateToken, FundTransferController.getTransferById);
router.post('/', authenticateToken, FundTransferController.createTransfer);
router.post('/:id/void', authenticateToken, FundTransferController.voidTransfer);

export default router;
