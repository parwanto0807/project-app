import express from 'express';
import { stockMonitoringController } from '../../controllers/inventory/stockMonitoringController.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes protected
router.use(authenticateToken);

router.get('/monitoring', stockMonitoringController.getMonitoringData);

export default router;
