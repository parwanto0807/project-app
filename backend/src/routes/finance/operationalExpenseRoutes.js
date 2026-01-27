import express from 'express';
import { operationalExpenseController } from '../../controllers/finance/operationalExpenseController.js';
import { uploadReceipt, handleUploadError } from '../../utils/opexUpload.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Semua route di sini memerlukan autentikasi
router.use(authenticateToken);

router.get('/', operationalExpenseController.getAll);
router.get('/:id', operationalExpenseController.getById);
router.post('/', uploadReceipt, handleUploadError, operationalExpenseController.create);
router.put('/:id', uploadReceipt, handleUploadError, operationalExpenseController.update);
router.patch('/:id/status', operationalExpenseController.updateStatus);
router.delete('/:id', operationalExpenseController.delete);

export default router;
