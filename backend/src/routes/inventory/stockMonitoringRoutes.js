import express from 'express';
import { stockMonitoringController } from '../../controllers/inventory/stockMonitoringController.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes protected
router.use(authenticateToken);

// Route untuk data monitoring
router.get('/monitoring', stockMonitoringController.getMonitoringData);

// Route untuk top usage
router.get('/top-usage', stockMonitoringController.getTopUsage);

// Route untuk top value
router.get('/top-value', stockMonitoringController.getTopValue);

// Route untuk history transaksi detail
router.get('/history', stockMonitoringController.getStockHistory);

// Route untuk latest stock balance per product & warehouse (Current Period)
router.get('/latest-stock', stockMonitoringController.getLatestStockBalance);

// Route untuk stock bookings (siapa yang booking stock)
router.get('/bookings', stockMonitoringController.getStockBookings);

// Route to get detailed stock on PO
router.get('/on-po', stockMonitoringController.getStockOnPO);

export default router;
