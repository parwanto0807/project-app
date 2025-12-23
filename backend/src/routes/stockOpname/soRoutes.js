import { Router } from 'express';
import { stockOpnameController } from '../../controllers/stockOpname/soController.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Endpoint List & Create
router.route('/')
  .get(stockOpnameController.getAll)
  .post(stockOpnameController.create);

// Endpoint Export
router.get('/export', stockOpnameController.exportData);

// Endpoint Detail, Update, & Delete
router.route('/:id')
  .get(stockOpnameController.getById)
  .put(stockOpnameController.update)
  .delete(stockOpnameController.delete);

// Endpoint Khusus Adjustment
router.patch('/:id/adjust', stockOpnameController.adjust);
router.patch('/:id/cancel', stockOpnameController.cancel);
router.patch('/:id/complete', stockOpnameController.complete);

export default router;