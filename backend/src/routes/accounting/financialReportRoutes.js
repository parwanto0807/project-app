import express from 'express';
import { financialReportController } from '../../controllers/accounting/financialReportController.js';

const router = express.Router();

/**
 * @route GET /api/accounting/reports/income-statement
 * @desc Get Income Statement (Profit & Loss)
 * @access Private
 */
router.get('/income-statement', financialReportController.getIncomeStatement);
router.get('/balance-sheet', financialReportController.getBalanceSheet);

export default router;
