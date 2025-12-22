import express from 'express';
import { stockMonitoringController } from '../../controllers/inventory/stockMonitoringController.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes protected
router.use(authenticateToken);

// Route untuk data monitoring
router.get('/monitoring', stockMonitoringController.getMonitoringData);

// Route untuk history transaksi detail
router.get('/history', stockMonitoringController.getStockHistory);

// Route untuk latest stock balance per product & warehouse (Current Period)
router.get('/latest-stock', stockMonitoringController.getLatestStockBalance);

export default router;
