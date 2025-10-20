// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
// const prisma = new PrismaClient();

import { prisma } from '../../config/db.js';

/**
 * GET /sales-orders/:soId/documents
 * Optional query: ?docType=QUOTATION|PO|BAP|INVOICE|PAYMENT_RECEIPT
 */
export const getBySalesOrderId = async (req, res) => {
  try {
    const { soId } = req.params;
    const { docType } = req.query;

    const where = { salesOrderId: soId };
    if (docType) where.docType = docType; // validasi ringan, enum dijaga di DB

    const docs = await prisma.salesOrderDocument.findMany({
      where,
      orderBy: [{ docDate: "desc" }, { createdAt: "desc" }],
    });

    // kembalikan array (bisa kosong)
    return res.json(docs);
  } catch (error) {
    console.error("getBySalesOrderId error:", error);
    return res.status(500).json({ message: "Gagal mengambil dokumen" });
  }
};

/**
 * POST /sales-orders/:soId/documents
 * Body: { docType, docNumber?, docDate?, fileUrl?, meta? }
 */
export const addDocument = async (req, res) => {
  try {
    const { soId } = req.params;
    const { docType, docNumber, docDate, fileUrl, meta } = req.body || {};

    if (!docType) {
      return res.status(400).json({ message: "docType wajib." });
    }

    // create dokumen
    const created = await prisma.salesOrderDocument.create({
      data: {
        salesOrderId: soId,
        docType,
        docNumber: docNumber || null,
        docDate: docDate ? new Date(docDate) : null,
        fileUrl: fileUrl || null,
        meta: typeof meta === "undefined" ? undefined : meta,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error("addDocument error:", error);
    return res.status(500).json({ message: "Gagal menambahkan dokumen" });
  }
};

/**
 * PATCH /sales-orders/:soId/documents/:docId
 * Body: { docType?, docNumber?, docDate?, fileUrl?, meta? }
 */
export const updateDocument = async (req, res) => {
  try {
    const { soId, docId } = req.params;
    const payload = req.body || {};

    // pastikan doc belong ke SO
    const exists = await prisma.salesOrderDocument.findUnique({
      where: { id: docId },
      select: { id: true, salesOrderId: true },
    });
    if (!exists || exists.salesOrderId !== soId) {
      return res.status(404).json({ message: "Dokumen tidak ditemukan pada Sales Order tersebut." });
    }

    const data = {};
    if (typeof payload.docType !== "undefined") data.docType = payload.docType;
    if (typeof payload.docNumber !== "undefined") data.docNumber = payload.docNumber || null;
    if (typeof payload.docDate !== "undefined")
      data.docDate = payload.docDate ? new Date(payload.docDate) : null;
    if (typeof payload.fileUrl !== "undefined") data.fileUrl = payload.fileUrl || null;
    if (typeof payload.meta !== "undefined") data.meta = payload.meta;

    const updated = await prisma.salesOrderDocument.update({
      where: { id: docId },
      data,
    });

    return res.json(updated);
  } catch (error) {
    console.error("updateDocument error:", error);
    return res.status(500).json({ message: "Gagal memperbarui dokumen" });
  }
};

/**
 * DELETE /sales-orders/:soId/documents/:docId
 */
export const removeDocument = async (req, res) => {
  try {
    const { soId, docId } = req.params;

    // pastikan doc belong ke SO
    const exists = await prisma.salesOrderDocument.findUnique({
      where: { id: docId },
      select: { id: true, salesOrderId: true },
    });
    if (!exists || exists.salesOrderId !== soId) {
      return res.status(404).json({ message: "Dokumen tidak ditemukan pada Sales Order tersebut." });
    }

    await prisma.salesOrderDocument.delete({ where: { id: docId } });
    return res.json({ message: "Dokumen berhasil dihapus" });
  } catch (error) {
    console.error("removeDocument error:", error);
    return res.status(500).json({ message: "Gagal menghapus dokumen" });
  }
};
