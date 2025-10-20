import { Prisma } from "../../../prisma/generated/prisma/index.js";
import { prisma } from '../../config/db.js';

import { toNum, calcLineTotal, recalcHeaderTotals } from "../../lib/soUtils.js";

/** Tambah 1 item ke SO */
const ALLOWED_ITEM_TYPES = new Set(["PRODUCT", "SERVICE", "CUSTOM"]);

export const addItem = async (req, res) => {  
  try {
    const { soId } = req.params;
    const it = req.body ?? {};
  
    // Pastikan SO ada
    const so = await prisma.salesOrder.findUnique({
      where: { id: soId },
      select: { id: true },
    });
    if (!so) {
      return res.status(404).json({ message: `SalesOrder tidak ditemukan: ${soId}` });
    }

    // itemType
    const itemType = typeof it.itemType === "string" ? it.itemType.toUpperCase() : "PRODUCT";
    if (!ALLOWED_ITEM_TYPES.has(itemType)) {
      return res.status(400).json({ message: "itemType tidak valid. Gunakan: PRODUCT | SERVICE | CUSTOM." });
    }

    // PERUBAHAN: PRODUCT & SERVICE ⇒ productId wajib
    if ((itemType === "PRODUCT" || itemType === "SERVICE") && !it.productId) {
      return res.status(400).json({ message: "productId wajib untuk itemType PRODUCT atau SERVICE." });
    }

    // Snapshot name/uom (untuk PRODUCT & SERVICE)
    let { name, uom } = it;
    if (itemType === "PRODUCT" || itemType === "SERVICE") {
      const needSnapshot = !name || !uom;
      const prod = await Prisma.product.findUnique({
        where: { id: it.productId },
        select: { id: true, name: true, uom: true },
      });
      if (!prod) {
        return res.status(400).json({ message: `Product/Service tidak ditemukan: ${it.productId}` });
      }
      if (needSnapshot) {
        name = name || prod.name;
        uom = uom ?? prod.uom ?? null;
      }
    } else { // itemType === "CUSTOM"
      // Untuk CUSTOM, abaikan productId. Akan di-set null.
      uom = uom ?? null;
    }

    if (!name || String(name).trim() === "") {
      return res.status(400).json({ message: "Nama item (name) tidak boleh kosong." });
    }

    // Numerik
    const qty = toNum(it.qty);
    const unitPrice = toNum(it.unitPrice);
    const discount = toNum(it.discount ?? 0);
    const taxRate = toNum(it.taxRate ?? 0);

    const isBad = (v) => Number.isNaN(v) || v === null || v === undefined;
    if (isBad(qty) || qty <= 0) return res.status(400).json({ message: "qty harus angka > 0." });
    if (isBad(unitPrice) || unitPrice < 0) return res.status(400).json({ message: "unitPrice harus angka ≥ 0." });
    if (isBad(discount) || discount < 0) return res.status(400).json({ message: "discount harus angka ≥ 0." });
    if (isBad(taxRate) || taxRate < 0 || taxRate > 100) {
      return res.status(400).json({ message: "taxRate harus angka 0–100." });
    }

    // Hitung lineTotal (EXCLUSIVE tax)
    const lineTotalNum = calcLineTotal(qty, unitPrice, discount, taxRate);

    const created = await prisma.$transaction(async (tx) => {
      // Hitung lineNo di dalam transaksi
      const agg = await tx.salesOrderItem.aggregate({
        where: { salesOrderId: soId },
        _max: { lineNo: true },
      });
      const nextLineNo = (agg._max.lineNo ?? 0) + 1;

      await tx.salesOrderItem.create({
        data: {
          salesOrderId: soId,
          lineNo: nextLineNo,
          itemType,
          // PERUBAHAN: productId null hanya untuk CUSTOM
          productId: itemType === "CUSTOM" ? null : it.productId,
          name,
          uom: uom ?? null,
          description: it.description ?? null,
          qty: new Prisma.Decimal(qty),
          unitPrice: new Prisma.Decimal(unitPrice),
          discount: new Prisma.Decimal(discount),
          taxRate: new Prisma.Decimal(taxRate),
          lineTotal: new Prisma.Decimal(lineTotalNum),
        },
      });

      await recalcHeaderTotals(tx, soId);

      return tx.salesOrder.findUnique({
        where: { id: soId },
        include: {
          customer: true,
          project: true,
          user: true,
          items: { include: { product: true } },
          documents: true,
        },
      });
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error("addItem error:", error);

    // Unique constraint (misal (salesOrderId,lineNo))
    if (error && error.code === "P2002") {
      return res.status(409).json({
        message: "Terjadi konflik penomoran baris. Silakan coba lagi.",
        detail: "Unique constraint violation on (salesOrderId, lineNo)",
      });
    }
    return res.status(500).json({ message: "Gagal menambah item." });
  }
};

/** Update 1 item lalu recalc header */
export const updateItem = async (req, res) => {
  try {
    const { soId, itemId } = req.params;
    const body = req.body || {};

    const existingItem = await prisma.salesOrderItem.findUnique({
      where: { id: itemId },
    });
    if (!existingItem || existingItem.salesOrderId !== soId) {
      return res.status(404).json({ message: "Item tidak ditemukan pada SO tersebut." });
    }

    const data = {};
    
    // Tentukan itemType final
    const finalItemType = body.itemType ?? existingItem.itemType;
    if (body.itemType) data.itemType = body.itemType;

    // PERUBAHAN: Logika productId disesuaikan dengan itemType
    if (finalItemType === "CUSTOM") {
      data.productId = null;
    } else if (finalItemType === "PRODUCT" || finalItemType === "SERVICE") {
      const finalProductId = body.productId ?? existingItem.productId;
      if (!finalProductId) {
        return res.status(400).json({ message: `productId wajib untuk item ${finalItemType}.` });
      }
      data.productId = finalProductId;

      // Snapshot name/uom jika productId berubah atau jika name/uom tidak dikirim
      const needsSnapshot = (body.productId && body.productId !== existingItem.productId) || !body.name;
      if (needsSnapshot) {
        const prod = await prisma.product.findUnique({
          where: { id: finalProductId },
          select: { name: true, uom: true },
        });
        if (!prod) return res.status(400).json({ message: `Product/Service tidak ditemukan: ${finalProductId}` });
        if (!body.name) data.name = prod.name;
        if (typeof body.uom === 'undefined') data.uom = prod.uom ?? null;
      }
    }

    // Update field lainnya jika ada di body
    if (typeof body.name !== "undefined") data.name = body.name;
    if (typeof body.description !== "undefined") data.description = body.description ?? null;
    if (typeof body.uom !== "undefined") data.uom = body.uom ?? null;

    // Kalkulasi ulang numerik
    const qty = typeof body.qty !== "undefined" ? toNum(body.qty) : Number(existingItem.qty);
    const unitPrice = typeof body.unitPrice !== "undefined" ? toNum(body.unitPrice) : Number(existingItem.unitPrice);
    const discount = typeof body.discount !== "undefined" ? toNum(body.discount) : Number(existingItem.discount);
    const taxRate = typeof body.taxRate !== "undefined" ? toNum(body.taxRate) : Number(existingItem.taxRate);

    data.qty = new Prisma.Decimal(qty);
    data.unitPrice = new Prisma.Decimal(unitPrice);
    data.discount = new Prisma.Decimal(discount);
    data.taxRate = new Prisma.Decimal(taxRate);
    data.lineTotal = new Prisma.Decimal(calcLineTotal(qty, unitPrice, discount, taxRate));

    const updatedSO = await prisma.$transaction(async (tx) => {
      await tx.salesOrderItem.update({ where: { id: itemId }, data });
      await recalcHeaderTotals(tx, soId);
      return tx.salesOrder.findUnique({
        where: { id: soId },
        include: {
          customer: true, project: true, user: true,
          items: { include: { product: true } }, documents: true,
        },
      });
    });

    res.status(200).json(updatedSO);
  } catch (error) {
    console.error("updateItem error:", error);
    res.status(500).json({ message: "Gagal memperbarui item." });
  }
};

/** Hapus 1 item lalu recalc header */
export const removeItem = async (req, res) => {
  try {
    const { soId, itemId } = req.params;

    const belong = await prisma.salesOrderItem.findUnique({
      where: { id: itemId }, select: { salesOrderId: true },
    });
    if (!belong || belong.salesOrderId !== soId) {
      return res.status(404).json({ message: "Item tidak ditemukan pada SO tersebut." });
    }

    const updatedSO = await prisma.$transaction(async (tx) => {
      await tx.salesOrderItem.delete({ where: { id: itemId } });
      await recalcHeaderTotals(tx, soId);
      return tx.salesOrder.findUnique({
        where: { id: soId },
        include: {
          customer: true, project: true, user: true,
          items: { include: { product: true } }, documents: true,
        },
      });
    });

    res.status(200).json(updatedSO);
  } catch (error) {
    console.error("removeItem error:", error);
    res.status(500).json({ message: "Gagal menghapus item." });
  }
};
