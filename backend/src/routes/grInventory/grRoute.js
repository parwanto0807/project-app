import express from 'express';
import {
  getAllGoodsReceipts,
  getGoodsReceiptById,
  createGoodsReceipt,
  createGoodsReceiptFromPO,
  updateGoodsReceipt,
  deleteGoodsReceipt,
  getGoodsReceiptsByPurchaseOrder,
  validateGrNumber,
  getGoodsReceiptSummary,
  updateQCStatus,
  getPendingQCItems,
  getNextGRNumber,
  markGoodsArrived,
  recordQCCheck,
  approveGR
} from '../../controllers/grInventory/grController.js';

const router = express.Router();

// Middleware untuk validasi
const validateGRCreate = (req, res, next) => {
  const { purchaseOrderId, warehouseId, receivedById, items } = req.body;
  
  // grNumber is now optional - will be auto-generated if not provided
  if (!purchaseOrderId || !warehouseId || !receivedById || !items || !Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: purchaseOrderId, warehouseId, receivedById, items (array)'
    });
  }

  // Validasi items array dengan QC
  for (const [index, item] of items.entries()) {
    if (!item.productId || !item.qtyReceived || !item.unit) {
      return res.status(400).json({
        success: false,
        error: `Item ${index + 1} must have productId, qtyReceived, and unit`
      });
    }
    
    // Validasi kuantitas QC
    if (item.qtyPassed !== undefined && item.qtyRejected !== undefined) {
      const total = parseFloat(item.qtyPassed) + parseFloat(item.qtyRejected);
      const received = parseFloat(item.qtyReceived);
      
      if (Math.abs(total - received) > 0.0001) { // Tolerance for decimal comparison
        return res.status(400).json({
          success: false,
          error: `Item ${index + 1}: qtyPassed + qtyRejected must equal qtyReceived`
        });
      }
    }
  }

  next();
};

const validateQCUpdate = (req, res, next) => {
  const { items } = req.body;
  
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Items array is required with at least one item'
    });
  }

  for (const [index, item] of items.entries()) {
    if (!item.itemId) {
      return res.status(400).json({
        success: false,
        error: `Item ${index + 1} must have itemId`
      });
    }

    if (item.qtyPassed !== undefined && item.qtyRejected !== undefined) {
      // Validasi akan dilakukan di controller setelah mengambil data existing
    } else if (!item.qcStatus) {
      return res.status(400).json({
        success: false,
        error: `Item ${index + 1} must have either qcStatus or both qtyPassed and qtyRejected`
      });
    }
  }

  next();
};

// Routes
// Special routes MUST come before dynamic :id routes
router.get('/summary', getGoodsReceiptSummary); // GET /api/gr/summary?startDate=...&endDate=...
router.get('/pending-qc', getPendingQCItems); // GET /api/gr/pending-qc
router.get('/generate-number', getNextGRNumber); // GET /api/gr/generate-number
router.get('/purchase-order/:purchaseOrderId', getGoodsReceiptsByPurchaseOrder); // GET /api/gr/purchase-order/:purchaseOrderId
router.get('/validate/:grNumber', validateGrNumber); // GET /api/gr/validate/:grNumber
router.post('/from-po/:poId', createGoodsReceiptFromPO); // POST /api/gr/from-po/:poId - Auto-create GR from PO

// General CRUD routes (with dynamic :id)
router.get('/', getAllGoodsReceipts); // GET /api/gr?page=1&limit=10&search=...
router.get('/:id', getGoodsReceiptById); // GET /api/gr/:id
router.post('/', validateGRCreate, createGoodsReceipt); // POST /api/gr
router.put('/:id', updateGoodsReceipt); // PUT /api/gr/:id (basic update)
router.patch('/:id/qc', validateQCUpdate, updateQCStatus); // PATCH /api/gr/:id/qc (QC update)

// Workflow routes
router.patch('/:id/arrived', markGoodsArrived); // PATCH /api/gr/:id/arrived - Mark goods as arrived
router.patch('/:id/qc-check', recordQCCheck); // PATCH /api/gr/:id/qc-check - Record QC results
router.post('/:id/approve', approveGR); // POST /api/gr/:id/approve - Approve and update stock

router.delete('/:id', deleteGoodsReceipt); // DELETE /api/gr/:id

// Export router
export default router;