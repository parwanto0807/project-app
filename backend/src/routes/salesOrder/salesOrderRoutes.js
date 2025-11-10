import express from "express";

// Controllers
import * as salesOrder from "../../controllers/salesOrder/salesOrderController.js";
import * as item from "../../controllers/salesOrder/salesOrderItemController.js";
import * as doc from "../../controllers/salesOrder/salesOrderDocumentController.js";
import {
  createProject,
  getListProjects,
} from "../../controllers/salesOrder/projectController.js";

// Middleware
import { authenticateToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

/* -------------------------------------------
 * SALES ORDERS (header-level)
 * ----------------------------------------- */
// List semua SO
router.get("/sales-orders", salesOrder.getAll);
router.get("/sales-orders-invoice", salesOrder.getAllInvoice);
router.get("/sales-orders-bap", salesOrder.getAllBap);

// Detail SO
router.get("/sales-orders/getById/:id", salesOrder.getById);

// SO terakhir (berdasarkan soNumber di bulan berjalan)
router.get("/sales-orders-last", salesOrder.getLastSalesOrder);
router.get("/getMonthlySales", salesOrder.getMonthlySales);

// Create SO (header + items + (optional) documents)
router.post("/sales-orders/create", authenticateToken, salesOrder.create);

// Update header SO (tanpa ganti items/documents)
router.put(
  "/sales-orders/update/:id",
  authenticateToken,
  salesOrder.updateWithItems
);

// Update SO + replace all items (editor tabel)
router.put(
  "/sales-orders/:id/with-items",
  authenticateToken,
  salesOrder.updateWithItems
);

// Hapus SO (cascade hapus items & documents)
router.delete("/sales-orders/remove/:id", salesOrder.remove);

/* -------------------------------------------
 * SALES ORDER ITEMS (item-level)
 * ----------------------------------------- */
// Tambah 1 item ke SO
router.post("/sales-orders/:soId/items", authenticateToken, item.addItem);

// Update 1 item di SO
router.patch(
  "/sales-orders/:soId/items/:itemId",
  authenticateToken,
  item.updateItem
);

// Hapus 1 item dari SO
router.delete(
  "/sales-orders/:soId/items/:itemId",
  authenticateToken,
  item.removeItem
);

/* -------------------------------------------
 * SALES ORDER DOCUMENTS (document-level)
 * ----------------------------------------- */
// Ambil semua dokumen milik SO
router.get("/sales-orders/:soId/documents", doc.getBySalesOrderId);

// Tambah dokumen (docType, nomor, tanggal, fileUrl, meta)
router.post(
  "/sales-orders/:soId/documents",
  authenticateToken,
  doc.addDocument
);

// Update 1 dokumen (mis. ganti nomor/tanggal/file/meta)
router.patch(
  "/sales-orders/:soId/documents/:docId",
  authenticateToken,
  doc.updateDocument
);

// Hapus 1 dokumen
router.delete(
  "/sales-orders/:soId/documents/:docId",
  authenticateToken,
  doc.removeDocument
);

/* -------------------------------------------
 * PROJECTS (opsional)
 * ----------------------------------------- */
router.post("/project/create", createProject);
router.get("/project/getListProjects", getListProjects);
router.get("/getRecentSalesOrders", salesOrder.getRecentSalesOrders);
router.get("/getSalesOrderSummary", salesOrder.getSalesOrderSummary);
router.get("/getSalesStats", salesOrder.getSalesStats);
router.get("/getSalesOrderCount", salesOrder.getSalesOrderCount);

export default router;
