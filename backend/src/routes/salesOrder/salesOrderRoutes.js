import express from 'express';

// Import controller
import * as salesOrder from '../../controllers/salesOrder/salesOrderController.js';
import * as item from '../../controllers/salesOrder/salesOrderItemController.js';
import * as doc from '../../controllers/salesOrder/salesOrderDocumentController.js';

const router = express.Router();

//
// ROUTES UNTUK SALES ORDER
//

// [GET] Semua sales order
router.get('/getAllSalesOrders', salesOrder.getAll);

// [GET] Detail SO by ID
router.get('/getByIdSalesOrders/:id', salesOrder.getById);

// [POST] Tambah SO (beserta items dan document kosong)
router.post('/createSalesOrders', salesOrder.create);

// [PUT] Update SO
router.put('/updateSalesOrders/:id', salesOrder.update);

// [DELETE] Hapus SO
router.delete('/removeSalesOrders/:id', salesOrder.remove);

//
// ROUTES UNTUK ITEM
//

// [POST] Tambah item ke SO
router.post('/addItemSalesOrders/:id/items', item.addItem);

// [PUT] Update item
router.put('/updateItemSalesOrders/items/:itemId', item.updateItem);

// [DELETE] Hapus item dari SO
router.delete('/removeItemSalesOrders/items/:itemId', item.removeItem);

//
// ROUTES UNTUK DOKUMEN
//

// [GET] Ambil dokumen berdasarkan salesOrderId
router.get('/getBySOIdSalesOrders/:id/document', doc.getBySOId);

// [PUT] Update flag dokumen
router.put('/updateFlagsSalesOrders/:id/document', doc.updateFlags);

export default router;
