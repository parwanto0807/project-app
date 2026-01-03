import express from 'express';
import {
    getAllSupplierPayments,
    getSupplierPaymentById,
    createSupplierPayment,
    updateSupplierPayment,
    deleteSupplierPayment,
    generatePaymentNumber,
} from '../../controllers/invoiceSupplier/supplierPaymentController.js';

const router = express.Router();

// Supplier Payment Routes
router.get('/', getAllSupplierPayments);
router.get('/generate-number', generatePaymentNumber);
router.get('/:id', getSupplierPaymentById);
router.post('/', createSupplierPayment);
router.put('/:id', updateSupplierPayment);
router.delete('/:id', deleteSupplierPayment);

export default router;
