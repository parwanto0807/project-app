import { Prisma } from "../../../prisma/generated/prisma/index.js";
import { prisma } from "../../lib/prismaClient.js";
import { toNum, rollup } from "../../lib/soUtils.js";

/** Hitung total per baris */
function calcLineTotal(qty, unitPrice, discount, taxRate) {
  const base = qty * unitPrice;
  const afterDisc = Math.max(base - discount, 0);
  const tax = (taxRate / 100) * afterDisc;
  return Math.max(afterDisc + tax, 0);
}

// ===================== Controllers =====================

/** Ambil semua sales order */
export const getAll = async (req, res) => {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        project: true,
        user: true,
        items: { include: { product: true } },
        documents: true,
      },
      orderBy: { soDate: "desc" },
    });
    res.json(salesOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data Sales Order" });
  }
};

/** Ambil SO terakhir (berdasarkan soNumber) di bulan berjalan */
export const getLastSalesOrder = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const lastSalesOrder = await prisma.salesOrder.findFirst({
      where: { soDate: { gte: startDate, lte: endDate } },
      orderBy: { soNumber: "desc" },
      select: { soNumber: true },
    });

    res.status(200).json(lastSalesOrder); // bisa null kalau belum ada
  } catch (error) {
    console.error("Error fetching last sales order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/** Ambil 1 SO by ID */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        user: true,
        items: { include: { product: true } },
        documents: true,
      },
    });
    if (!salesOrder) {
      return res.status(404).json({ message: "Sales Order tidak ditemukan" });
    }
    res.json(salesOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data Sales Order" });
  }
};

const ALLOWED_ITEM_TYPES = new Set(["PRODUCT", "SERVICE", "CUSTOM"]);

const r2 = (n) => Math.round(n * 100) / 100;
// const toNum = (v) => {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : NaN;
// };

// Exclusive tax: total = (qty*unitPrice - discount) + tax
function calcLineExclusive(qty, unitPrice, discount, taxRate) {
  const gross = qty * unitPrice;
  const net = Math.max(0, gross - discount);
  const tax = r2(net * ((taxRate || 0) / 100));
  const total = r2(net + tax);
  return { net: r2(net), tax, total };
}

export const create = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ message: "Akses tidak sah. Silakan login." });
    }
    const userId = req.user.userId;

    // Body:
    // { soNumber?, soDate, customerId, projectId, type, status?, currency?, notes?,
    //   items: [{ itemType?, productId?, name?, description?, uom?, qty, unitPrice, discount?, taxRate? }, ...],
    //   documents?: [{ docType, docNumber?, docDate?, fileUrl?, meta? }, ...] }

    const {
      soNumber,
      soDate,
      customerId,
      projectId,
      type,
      status,
      currency,
      notes,
      items,
      documents,
    } = req.body ?? {};

    // Validasi header minimal
    if (
      !soDate ||
      !customerId ||
      !projectId ||
      !type ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Data yang dikirim tidak lengkap." });
    }

    // Siapkan items + hitung totals header
    const preparedItems = [];
    let subtotal = 0; // SUM(net) = setelah diskon, sebelum pajak
    let discountTotal = 0; // SUM(discount rupiah)
    let taxTotal = 0; // SUM(tax)
    let grandTotal = 0; // SUM(total)

    for (let i = 0; i < items.length; i++) {
      const it = items[i] ?? {};
      const idx = i + 1;

      // Normalisasi itemType
      const itemType =
        typeof it.itemType === "string" ? it.itemType.toUpperCase() : "PRODUCT";
      if (!ALLOWED_ITEM_TYPES.has(itemType)) {
        return res.status(400).json({
          message: `itemType tidak valid pada baris ${idx}. Gunakan: PRODUCT | SERVICE | CUSTOM.`,
        });
      }

      // PRODUCT ⇒ productId wajib
      if (itemType === "PRODUCT" && !it.productId) {
        return res.status(400).json({
          message: `productId wajib untuk item PRODUCT (baris ${idx}).`,
        });
      }

      // Snapshot name/uom (kalau kosong dan ada productId)
      let name = it.name;
      let uom = it.uom ?? null;
      if ((!name || !uom) && it.productId) {
        const prod = await prisma.product.findUnique({
          where: { id: it.productId },
          select: { name: true, uom: true },
        });
        if (!prod) {
          return res
            .status(400)
            .json({ message: `Product tidak ditemukan: ${it.productId}` });
        }
        if (!name) name = prod.name || undefined;
        if (!uom) uom = prod.uom ?? null;
      } else {
        // SERVICE/CUSTOM: abaikan productId, uom boleh null
        if (itemType !== "PRODUCT") {
          uom = uom ?? null;
        }
      }

      // Validasi name wajib untuk semua item
      if (!name || String(name).trim() === "") {
        return res
          .status(400)
          .json({ message: `Nama item wajib diisi (baris ${idx}).` });
      }

      // Numerik
      const qty = toNum(it.qty);
      const unitPrice = toNum(it.unitPrice);
      const discount = toNum(it.discount ?? 0);
      const taxRate = toNum(it.taxRate ?? 0);

      const isBad = (v) => Number.isNaN(v) || v === null || v === undefined;
      if (isBad(qty) || qty <= 0)
        return res
          .status(400)
          .json({ message: `qty harus angka > 0 (baris ${idx}).` });
      if (isBad(unitPrice) || unitPrice < 0)
        return res
          .status(400)
          .json({ message: `unitPrice harus angka ≥ 0 (baris ${idx}).` });
      if (isBad(discount) || discount < 0)
        return res
          .status(400)
          .json({ message: `discount harus angka ≥ 0 (baris ${idx}).` });
      if (isBad(taxRate) || taxRate < 0 || taxRate > 100) {
        return res
          .status(400)
          .json({ message: `taxRate harus angka 0–100 (baris ${idx}).` });
      }

      // Hitung (exclusive)
      const amt = calcLineExclusive(qty, unitPrice, discount, taxRate);

      subtotal += amt.net;
      discountTotal += discount;
      taxTotal += amt.tax;
      grandTotal += amt.total;

      preparedItems.push({
        lineNo: idx, // 1..n
        itemType,
        productId: itemType === "PRODUCT" ? it.productId : null,
        name,
        uom,
        description: it.description ?? null,
        qty: new Prisma.Decimal(qty),
        unitPrice: new Prisma.Decimal(unitPrice),
        discount: new Prisma.Decimal(discount),
        taxRate: new Prisma.Decimal(taxRate),
        lineTotal: new Prisma.Decimal(amt.total),
      });
    }

    // Transaksi: create header + items + documents
    const created = await prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.create({
        data: {
          // soNumber opsional: kirim bila ada, atau biarkan BE/generator yang isi
          ...(soNumber ? { soNumber } : {}),
          soDate: new Date(soDate),
          customer: { connect: { id: customerId } },
          project: { connect: { id: projectId } }, // FK wajib
          user: { connect: { id: userId } },
          type, // REGULAR | SUPPORT
          ...(status ? { status } : {}), // default DRAFT di DB
          currency: currency || "IDR",
          notes: notes ?? null,

          subtotal: new Prisma.Decimal(r2(subtotal)),
          discountTotal: new Prisma.Decimal(r2(discountTotal)),
          taxTotal: new Prisma.Decimal(r2(taxTotal)),
          grandTotal: new Prisma.Decimal(r2(grandTotal)),

          items: { create: preparedItems },

          ...(Array.isArray(documents) && documents.length > 0
            ? {
                documents: {
                  create: documents.map((d) => ({
                    docType: d.docType,
                    docNumber: d.docNumber ?? null,
                    docDate: d.docDate ? new Date(d.docDate) : null,
                    fileUrl: d.fileUrl ?? null,
                    meta: d.meta ?? undefined,
                  })),
                },
              }
            : {}),
        },
        include: {
          customer: true,
          project: true,
          user: true,
          items: { include: { product: true } },
          documents: true,
        },
      });

      return so;
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error("Error creating sales order in backend:", error);

    // Unique soNumber
    if (
      error &&
      error.code === "P2002" &&
      error.meta &&
      error.meta.target &&
      error.meta.target.includes("soNumber")
    ) {
      return res.status(409).json({ message: "Nomor SO sudah digunakan." });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/** Update header SO saja (tanpa ubah items/documents) */
export const updateWithItems = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      soNumber,
      soDate,
      customerId,
      projectId,
      type,
      status,
      notes,
      items,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Minimal 1 item diperlukan." });
    }

    // Siapkan items
    const preparedItems = [];
    for (const it of items) {
      // if (!it.productId) return res.status(400).json({ message: "productId wajib di setiap item." });

      // ambil snapshot jika name/uom kosong
      let name = it.name,
        uom = it.uom;
      if (!name || !uom) {
        const prod = await prisma.product.findUnique({
          where: { id: it.productId },
          select: { name: true },
        });
        if (!prod)
          return res
            .status(400)
            .json({ message: `Product tidak ditemukan: ${it.productId}` });
        name = name || prod.name || null;
      }

      const qty = toNum(it.qty);
      const unitPrice = toNum(it.unitPrice);
      const discount = toNum(it.discount || 0);
      const taxRate = toNum(it.taxRate || 0);

      preparedItems.push({
        salesOrderId: id,
        itemType: it.itemType || "PRODUCT",
        productId: it.productId,
        name,
        uom,
        description: it.description || null,
        qty: new Prisma.Decimal(qty),
        unitPrice: new Prisma.Decimal(unitPrice),
        discount: new Prisma.Decimal(discount),
        taxRate: new Prisma.Decimal(taxRate),
        lineTotal: new Prisma.Decimal(
          Math.max(
            qty * unitPrice -
              discount +
              (taxRate / 100) * Math.max(qty * unitPrice - discount, 0),
            0
          )
        ),
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // optional header update
      const headerData = {};
      if (soNumber) headerData.soNumber = soNumber;
      if (soDate) headerData.soDate = new Date(soDate);
      if (customerId) headerData.customer = { connect: { id: customerId } };
      if (projectId === null) headerData.project = { disconnect: true };
      else if (projectId) headerData.project = { connect: { id: projectId } };
      if (type) headerData.type = type;
      if (status) headerData.status = status;
      if (typeof notes !== "undefined") headerData.notes = notes;

      if (Object.keys(headerData).length) {
        await tx.salesOrder.update({ where: { id }, data: headerData });
      }

      await tx.salesOrderItem.deleteMany({ where: { salesOrderId: id } });
      await tx.salesOrderItem.createMany({ data: preparedItems });

      // recalc header dari DB
      // (gunakan recalcHeaderTotals jika dipindahkan ke utils)
      const dbItems = await tx.salesOrderItem.findMany({
        where: { salesOrderId: id },
        select: { qty: true, unitPrice: true, discount: true, taxRate: true },
      });
      const totals = rollup(
        dbItems.map((x) => ({
          qty: Number(x.qty),
          unitPrice: Number(x.unitPrice),
          discount: Number(x.discount),
          taxRate: Number(x.taxRate),
        }))
      );
      await tx.salesOrder.update({
        where: { id },
        data: {
          subtotal: new Prisma.Decimal(totals.subtotal),
          discountTotal: new Prisma.Decimal(totals.discountTotal),
          taxTotal: new Prisma.Decimal(totals.taxTotal),
          grandTotal: new Prisma.Decimal(totals.grandTotal),
        },
      });

      return tx.salesOrder.findUnique({
        where: { id },
        include: {
          customer: true,
          project: true,
          user: true,
          items: { include: { product: true } },
          documents: true,
        },
      });
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("updateWithItems error:", error);
    if (error?.code === "P2002" && error?.meta?.target?.includes("soNumber")) {
      return res.status(409).json({ message: "Nomor SO sudah digunakan." });
    }
    res
      .status(500)
      .json({ message: "Gagal memperbarui Sales Order beserta items." });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.salesOrder.delete({ where: { id } });
    res.json({ message: "Sales Order berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menghapus Sales Order" });
  }
};
