
import express from "express";
import PeriodController from "../../controllers/accounting/periodController.js";
import { body, param, query } from "express-validator";
import { authenticateToken, authorizeAdmin } from "../../middleware/authMiddleware.js";

const router = express.Router();

const createValidation = [
    body('periodCode').notEmpty().withMessage('Period Code is required'),
    body('periodName').notEmpty(),
    body('startDate').isISO8601().toDate(),
    body('endDate').isISO8601().toDate()
];

router.get('/', PeriodController.getPeriods);
router.get('/:id', [param('id').isUUID()], PeriodController.getPeriodById);
// Create & Delete are restricted to admin only
router.post('/', authenticateToken, authorizeAdmin, createValidation, PeriodController.createPeriod);
router.put('/:id', PeriodController.updatePeriod);
router.delete('/:id', [param('id').isUUID()], authenticateToken, authorizeAdmin, PeriodController.deletePeriod);
router.get('/:id/validate-closing', PeriodController.getClosingValidation);
router.post('/:id/close', PeriodController.closePeriod);
router.post('/:id/reopen', PeriodController.reopenPeriod);

export default router;
