import express from "express";
import { staffBalanceController } from "../../controllers/staffBalance/staffBalanceController.js";

const router = express.Router();

/**
 * @route   GET /api/staff-balance
 * @desc    Get all staff balances with pagination and filters
 * @access  Private
 */
router.get("/", staffBalanceController.getAllStaffBalances);

/**
 * @route   GET /api/staff-balance/summary
 * @desc    Get summary statistics for all staff balances
 * @access  Private
 */
router.get("/summary", staffBalanceController.getStaffBalanceSummary);

/**
 * @route   GET /api/staff-balance/karyawan/:karyawanId
 * @desc    Get staff balance by employee ID
 * @access  Private
 */
router.get("/karyawan/:karyawanId", staffBalanceController.getStaffBalanceByKaryawan);

/**
 * @route   GET /api/staff-balance/ledger/:karyawanId
 * @desc    Get staff ledger (transaction history) by employee ID
 * @access  Private
 */
router.get("/ledger/:karyawanId", staffBalanceController.getStaffLedgerByKaryawan);

/**
 * @route   POST /api/staff-balance/opening-balance
 * @desc    Create opening balance for staff
 * @access  Private
 */
router.post("/opening-balance", staffBalanceController.createOpeningBalance);

/**
 * @route   POST /api/staff-balance/refund
 * @desc    Process staff refund (money back to company)
 * @access  Private
 */
router.post("/refund", staffBalanceController.processStaffRefund);

/**
 * @route   POST /api/staff-balance/settle-pr
 * @desc    Settle PR budget (Refund or Reimburse)
 * @access  Private
 */
router.post("/settle-pr", staffBalanceController.settlePRBudget);

export default router;
