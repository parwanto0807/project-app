import express from 'express';
import {
    generateInvoiceNumber,
    getAllSupplierInvoices,
    getSupplierInvoiceById,
    createSupplierInvoice,
    updateSupplierInvoice,
    updateSupplierInvoiceStatus,
    deleteSupplierInvoice,
} from '../../controllers/invoiceSupplier/supplierInvoiceController.js';

const router = express.Router();

// Supplier Invoice Routes
router.get('/generate-number', generateInvoiceNumber);
router.get('/', getAllSupplierInvoices);
router.get('/:id', getSupplierInvoiceById);
router.post('/', createSupplierInvoice);
router.put('/:id', updateSupplierInvoice);
router.patch('/:id/status', updateSupplierInvoiceStatus);
router.delete('/:id', deleteSupplierInvoice);

export default router;
