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
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

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

      // PRODUCT & SERVICE ⇒ productId wajib
      if ((itemType === "PRODUCT" || itemType === "SERVICE") && !it.productId) {
        return res.status(400).json({
          message: `productId wajib untuk item ${itemType} (baris ${idx}).`,
        });
      }

      // Snapshot name/uom (untuk PRODUCT & SERVICE)
      let name = it.name;
      let uom = it.uom ?? null;
      if (itemType === "PRODUCT" || itemType === "SERVICE") {
        const needSnapshot = !name || !uom;
        if (needSnapshot) {
          // PERBAIKAN: Gunakan instance `prisma` (lowercase)
          const prod = await prisma.product.findUnique({
            where: { id: it.productId },
            select: { name: true, uom: true },
          });
          if (!prod) {
            return res.status(400).json({
              message: `Product/Service tidak ditemukan: ${it.productId}`,
            });
          }
          if (!name) name = prod.name || undefined;
          if (!uom) uom = prod.uom ?? null;
        }
      } else {
        // itemType === "CUSTOM"
        uom = uom ?? null;
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

      // Hitung (exclusive) - diasumsikan fungsi ini ada dan benar
      const amt = calcLineExclusive(qty, unitPrice, discount, taxRate);

      subtotal += amt.net;
      discountTotal += qty * unitPrice - amt.net; // Menghitung diskon nominal
      taxTotal += amt.tax;
      grandTotal += amt.total;

      preparedItems.push({
        lineNo: idx, // 1..n
        itemType,
        // productId null hanya untuk CUSTOM
        productId: itemType === "CUSTOM" ? null : it.productId,
        name,
        uom,
        description: it.description ?? null,
        qty: new Prisma.Decimal(qty),
        unitPrice: new Prisma.Decimal(unitPrice),
        discount: new Prisma.Decimal(discount),
        taxRate: new Prisma.Decimal(taxRate),
        lineTotal: new Prisma.Decimal(amt.net), // lineTotal konsisten (sebelum pajak)
      });
    }

    // Transaksi: create header + items + documents
    // PERBAIKAN: Gunakan instance `prisma` (lowercase)
    const created = await prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.create({
        data: {
          ...(soNumber ? { soNumber } : {}),
          soDate: new Date(soDate),
          customer: { connect: { id: customerId } },
          project: { connect: { id: projectId } },
          user: { connect: { id: userId } },
          type,
          ...(status ? { status } : {}),
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
    } = req.body || {};

    // --- guard ---
    if (!id) return res.status(400).json({ message: "Missing SalesOrder id." });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Minimal 1 item diperlukan." });
    }

    // helper angka
    const toNum = (v) =>
      v === null || v === undefined || v === "" ? NaN : Number(v);
    const bad = (v) => Number.isNaN(v) || v === null || v === undefined;

    // --- normalisasi items ---
    const normalized = [];
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx] || {};
      const rawType =
        typeof it.itemType === "string" ? it.itemType.toUpperCase() : "PRODUCT";
      const itemType =
        rawType === "SERVICE" || rawType === "CUSTOM" ? rawType : "PRODUCT";

      // ✅ PERBAIKAN: PRODUCT & SERVICE ⇒ productId wajib
      if ((itemType === "PRODUCT" || itemType === "SERVICE") && !it.productId) {
        return res.status(400).json({
          message: `productId wajib untuk item ${itemType}.`,
        });
      }

      // ✅ PERBAIKAN: Snapshot untuk PRODUCT dan SERVICE
      let name = it.name;
      let uom = it.uom ?? null;
      if (
        (itemType === "PRODUCT" || itemType === "SERVICE") &&
        (!name || !uom)
      ) {
        const productOrService = await prisma.product.findUnique({
          where: { id: it.productId },
          select: { name: true, uom: true },
        });
        if (!productOrService) {
          return res.status(400).json({
            message: `${
              itemType === "PRODUCT" ? "Product" : "Service"
            } tidak ditemukan: ${it.productId}`,
          });
        }
        name = name || productOrService.name;
        uom = uom || productOrService.uom || null;
      }

      // Validasi name wajib untuk semua item
      if (!name || String(name).trim() === "") {
        return res
          .status(400)
          .json({ message: "Nama item (name) tidak boleh kosong." });
      }

      // angka
      const qty = toNum(it.qty);
      const unitPrice = toNum(it.unitPrice);
      const discount = toNum(it.discount ?? 0);
      const taxRate = toNum(it.taxRate ?? 0);

      if (bad(qty) || qty <= 0)
        return res.status(400).json({ message: "qty harus angka > 0." });
      if (bad(unitPrice) || unitPrice < 0)
        return res.status(400).json({ message: "unitPrice harus angka ≥ 0." });
      if (bad(discount) || discount < 0)
        return res.status(400).json({ message: "discount harus angka ≥ 0." });
      if (bad(taxRate) || taxRate < 0 || taxRate > 100)
        return res.status(400).json({ message: "taxRate harus angka 0–100." });

      const bruto = qty * unitPrice;
      if (discount > bruto) {
        return res.status(400).json({
          message: "Discount tidak boleh melebihi (qty × unitPrice).",
        });
      }

      // roughLine: pakai item.lineNo kalau ada & valid, else idx+1
      const roughLine =
        Number.isInteger(it.lineNo) && it.lineNo > 0 ? it.lineNo : idx + 1;

      // line total
      const neto = Math.max(bruto - discount, 0);
      const lineTotal = Math.max(neto + (taxRate / 100) * neto, 0);

      // ✅ PERBAIKAN: productId hanya untuk PRODUCT dan SERVICE
      normalized.push({
        _roughLine: roughLine,
        itemType,
        productId:
          itemType === "PRODUCT" || itemType === "SERVICE"
            ? it.productId
            : null,
        name,
        uom,
        description: it.description ?? null,
        qty,
        unitPrice,
        discount,
        taxRate,
        lineTotal,
      });
    }

    // urutkan pakai roughLine, lalu tetapkan lineNo final 1..N
    const preparedForCreate = normalized
      .sort((a, b) => a._roughLine - b._roughLine)
      .map((it, i) => ({
        salesOrderId: id,
        lineNo: i + 1,
        itemType: it.itemType,
        productId: it.productId, // ✅ Sudah benar: PRODUCT/SERVICE punya productId, CUSTOM null
        name: it.name,
        uom: it.uom ?? null,
        description: it.description,
        qty: new Prisma.Decimal(it.qty),
        unitPrice: new Prisma.Decimal(it.unitPrice),
        discount: new Prisma.Decimal(it.discount),
        taxRate: new Prisma.Decimal(it.taxRate),
        lineTotal: new Prisma.Decimal(it.lineTotal),
      }));

    // header totals dari normalized (pakai angka murni biar cepat)
    const totals = normalized.reduce(
      (acc, it) => {
        const bruto = it.qty * it.unitPrice;
        const neto = Math.max(bruto - it.discount, 0);
        const tax = (it.taxRate / 100) * neto;
        acc.subtotal += bruto;
        acc.discountTotal += it.discount;
        acc.taxTotal += tax;
        acc.grandTotal += neto + tax;
        return acc;
      },
      { subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 0 }
    );

    const updated = await prisma.$transaction(async (tx) => {
      // 1) Update header bila ada field yang dikirim
      const headerData = {};
      if (soNumber) headerData.soNumber = soNumber;
      if (soDate) headerData.soDate = new Date(soDate);
      if (customerId) headerData.customerId = customerId;
      // projectId kolom wajib di model, jadi TIDAK boleh disconnect. Update hanya jika ada nilai.
      if (projectId) headerData.projectId = projectId;
      if (type) headerData.type = type;
      if (status) headerData.status = status;
      if (typeof notes !== "undefined") headerData.notes = notes;

      if (Object.keys(headerData).length) {
        await tx.salesOrder.update({ where: { id }, data: headerData });
      }

      // 2) Ganti semua items → deleteMany + createMany (dengan lineNo)
      await tx.salesOrderItem.deleteMany({ where: { salesOrderId: id } });
      await tx.salesOrderItem.createMany({ data: preparedForCreate });

      // 3) Update totals header
      await tx.salesOrder.update({
        where: { id },
        data: {
          subtotal: new Prisma.Decimal(totals.subtotal),
          discountTotal: new Prisma.Decimal(totals.discountTotal),
          taxTotal: new Prisma.Decimal(totals.taxTotal),
          grandTotal: new Prisma.Decimal(totals.grandTotal),
        },
      });

      // 4) Return SO lengkap; pastikan items diurutkan lineNo
      return tx.salesOrder.findUnique({
        where: { id },
        include: {
          customer: true,
          project: true,
          user: true,
          items: { include: { product: true }, orderBy: { lineNo: "asc" } },
          documents: true,
        },
      });
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("updateWithItems error:", error);
    if (error?.code === "P2002" && error?.meta?.target?.includes("soNumber")) {
      return res.status(409).json({ message: "Nomor SO sudah digunakan." });
    }
    return res
      .status(500)
      .json({ message: "Gagal memperbarui Sales Order beserta items." });
  }
};

export async function remove(req, res) {
  const { id } = req.params;

  // --- 1) Validasi sederhana UUID v4 (opsional, boleh dihapus kalau tak perlu)
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return res.status(400).json({ message: "Param id tidak valid." });
  }

  try {
    // --- 2) Pastikan SO ada
    const so = await prisma.salesOrder.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!so) {
      return res.status(404).json({ message: "Sales Order tidak ditemukan." });
    }

    // --- 3) Cek invoice terkait (blokir jika ada)
    const invoiceCount = await prisma.invoice.count({
      where: { salesOrderId: id },
    });

    if (invoiceCount > 0) {
      return res.status(409).json({
        message:
          "Sales Order sudah memiliki Invoice. Batalkan/hapus invoice terkait terlebih dahulu.",
      });
    }

    // --- 4) Eksekusi delete dalam transaksi
    // Notes: items & documents sudah CASCADE di schema, jadi cukup delete SalesOrder
    const deleted = await prisma.$transaction(async (tx) => {
      const resDelete = await tx.salesOrder.delete({
        where: { id },
      });
      return resDelete;
    });

    return res.status(200).json({
      message: "Sales Order berhasil dihapus.",
      data: { id: deleted.id, soNumber: deleted.soNumber },
    });
  } catch (err) {
    console.error("[deleteSalesOrder] error:", err);
    // Prisma foreign key error safety-net (kalau ada relasi lain yang mengunci)
    return res.status(500).json({
      message: "Gagal menghapus Sales Order.",
      error: err?.message ?? String(err),
    });
  }
}

function parseParams(q) {
  const period = (q.period || "month").toLowerCase(); // day|week|month|quarter|year
  const tz = q.tz || "UTC";

  const today = new Date();
  const defaultEnd = today;
  const defaultStart = new Date();
  defaultStart.setMonth(defaultStart.getMonth() - 6); // default 6 bulan mundur

  const start = q.start ? new Date(q.start) : defaultStart;
  // end pakai 23:59:59 agar inklusif
  const end = q.end ? new Date(q.end + "T23:59:59.999Z") : defaultEnd;

  const status =
    typeof q.status === "string" && q.status.trim()
      ? q.status
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

  const customerId = q.customerId || null;
  const projectId = q.projectId || null;

  return { period, tz, start, end, status, customerId, projectId };
}

function periodToDateTrunc(period) {
  switch (period) {
    case "day":
      return "day";
    case "week":
      return "week";
    case "quarter":
      return "quarter";
    case "year":
      return "year";
    case "month":
    default:
      return "month";
  }
}

export async function getSalesOrderSummary(req, res) {
  const { period, tz, start, end, status, customerId, projectId } = parseParams(
    req.query
  );
  const trunc = periodToDateTrunc(period);

  try {
    // Prefer raw SQL Postgres agar efisien (date_trunc + timezone)
    // Catatan: Prisma membuat nama tabel sesuai model "SalesOrder" (quoted). Jika kamu pakai @@map, sesuaikan nama tabelnya.
    const bindings = [];
    let whereSql = `WHERE "soDate" >= $1 AND "soDate" <= $2`;
    bindings.push(start);
    bindings.push(end);

    if (status && status.length) {
      const placeholders = status
        .map((_, i) => `$${bindings.length + i + 1}`)
        .join(", ");
      whereSql += ` AND "status" IN (${placeholders})`;
      bindings.push(...status);
    }
    if (customerId) {
      whereSql += ` AND "customerId" = $${bindings.length + 1}`;
      bindings.push(customerId);
    }
    if (projectId) {
      whereSql += ` AND "projectId" = $${bindings.length + 1}`;
      bindings.push(projectId);
    }

    // NOTE: soDate AT TIME ZONE 'tz' → date_trunc dilakukan pada zona waktu yang diinginkan
    // Kita juga kirim kembali batas start/end masing-masing bucket sebagai UTC (start_ts/end_ts)
    const raw = await prisma.$queryRawUnsafe(
      `
      SELECT
        date_trunc($${bindings.length + 1}, "soDate" AT TIME ZONE $${
        bindings.length + 2
      }) AS bucket_local,
        SUM("grandTotal")::numeric(18,2) AS total
      FROM "SalesOrder"
      ${whereSql}
      GROUP BY 1
      ORDER BY 1 ASC
      `,
      ...bindings,
      trunc,
      tz
    );

    // Bentuk respons rapi
    // bucket_local adalah timestamp tanpa timezone di zona lokal; untuk aman, kita treat sebagai local dan buat label period.
    const data = raw.map((row) => {
      const bucket = new Date(row.bucket_local); // interpretasi oleh node bisa sebagai UTC; untuk label cukup aman
      const total = Number(row.total);

      // label period sederhana
      let periodLabel = "";
      let bucketStart = new Date(bucket);
      let bucketEnd = new Date(bucket);

      switch (trunc) {
        case "day": {
          periodLabel = bucket.toISOString().slice(0, 10); // YYYY-MM-DD
          // start = hari tsb, end = hari tsb 23:59:59.999
          bucketEnd = new Date(bucketStart);
          bucketEnd.setUTCHours(23, 59, 59, 999);
          break;
        }
        case "week": {
          // label: ISO week, tetapi sederhana: YYYY-Wxx (perkiraan)
          const year = bucket.getUTCFullYear();
          const month = bucket.getUTCMonth();
          const date = bucket.getUTCDate();
          periodLabel = `${year}-W?`; // jika butuh ISO week akurat, bisa dihitung khusus
          // gunakan 7 hari window:
          bucketEnd = new Date(bucketStart);
          bucketEnd.setUTCDate(date + 6);
          bucketEnd.setUTCHours(23, 59, 59, 999);
          break;
        }
        case "quarter": {
          const y = bucket.getUTCFullYear();
          const q = Math.floor(bucket.getUTCMonth() / 3) + 1;
          periodLabel = `${y}-Q${q}`;
          // start = first day of quarter
          const qStartMonth = (q - 1) * 3;
          bucketStart = new Date(Date.UTC(y, qStartMonth, 1, 0, 0, 0, 0));
          // end = last day of quarter
          bucketEnd = new Date(
            Date.UTC(y, qStartMonth + 3, 0, 23, 59, 59, 999)
          );
          break;
        }
        case "year": {
          const y = bucket.getUTCFullYear();
          periodLabel = `${y}`;
          bucketStart = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
          bucketEnd = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
          break;
        }
        case "month":
        default: {
          const y = bucket.getUTCFullYear();
          const m = bucket.getUTCMonth() + 1;
          periodLabel = `${y}-${String(m).padStart(2, "0")}`; // YYYY-MM
          bucketStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
          bucketEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
          break;
        }
      }

      return {
        period: periodLabel,
        start: bucketStart.toISOString(),
        end: bucketEnd.toISOString(),
        total,
      };
    });

    res.json(data);
  } catch (err) {
    console.error("[getSalesOrderSummary] error:", err);

    // Fallback: jika DB tidak support query raw (harusnya Postgres ok),
    // lakukan agregasi di JS supaya tetap ada hasil.
    try {
      const where = {
        soDate: { gte: start, lte: end },
        ...(customerId ? { customerId } : {}),
        ...(projectId ? { projectId } : {}),
        ...(Array.isArray(status) && status.length
          ? { status: { in: status } }
          : {}),
      };
      const rows = await prisma.salesOrder.findMany({
        where,
        select: { soDate: true, grandTotal: true },
        orderBy: { soDate: "asc" },
      });

      const groupKey = (d) => {
        const dt = new Date(d);
        const y = dt.getUTCFullYear();
        const m = dt.getUTCMonth() + 1;
        const day = dt.getUTCDate();

        switch (trunc) {
          case "day":
            return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(
              2,
              "0"
            )}`;
          case "week": {
            // approximate week key by Monday-based blocks
            const tmp = new Date(Date.UTC(y, m - 1, day));
            const dow = (tmp.getUTCDay() + 6) % 7; // Mon=0..Sun=6
            tmp.setUTCDate(tmp.getUTCDate() - dow);
            const wy = tmp.getUTCFullYear();
            const wm = tmp.getUTCMonth() + 1;
            const wd = tmp.getUTCDate();
            return `${wy}-W${String(wm).padStart(2, "0")}-${String(wd).padStart(
              2,
              "0"
            )}`;
          }
          case "quarter":
            return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
          case "year":
            return `${y}`;
          case "month":
          default:
            return `${y}-${String(m).padStart(2, "0")}`;
        }
      };

      const map = new Map();
      for (const r of rows) {
        const k = groupKey(r.soDate);
        const prev = map.get(k) || 0;
        map.set(k, prev + Number(r.grandTotal));
      }

      const fallback = Array.from(map.entries())
        .map(([k, total]) => ({ period: k, total }))
        .sort((a, b) => a.period.localeCompare(b.period));

      res.json(fallback);
    } catch (inner) {
      console.error("[getSalesOrderSummary fallback] error:", inner);
      res.status(500).json({ message: "Gagal mengambil summary sales order" });
    }
  }
}

export async function getRecentSalesOrders(req, res) {
  try {
    const take = Math.min(
      50,
      Math.max(1, parseInt(String(req.query.take ?? "5"), 10) || 5)
    );
    const order =
      String(req.query.order ?? "desc").toLowerCase() === "asc"
        ? "asc"
        : "desc";

    const data = await prisma.salesOrder.findMany({
      take,
      orderBy: { soDate: order },
      select: {
        id: true,
        soNumber: true,
        soDate: true,
        status: true,
        grandTotal: true,
        customer: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Opsional: agar Decimal aman dikirim ke FE sebagai number
    const json = data.map((o) => ({
      ...o,
      grandTotal: Number(o.grandTotal), // FE sudah handle string/number, ini agar konsisten
    }));

    res.json({ data: json });
  } catch (err) {
    console.error("[getRecentSalesOrders] error:", err);
    res.status(500).json({ message: "Gagal mengambil daftar sales order" });
  }
}

function startOfDayLocal(d = new Date(), tzOffsetMinutes = 0) {
  // Jika kamu butuh Asia/Jakarta (UTC+7), set tzOffsetMinutes = 420
  const dt = new Date(d);
  // Normalisasi ke “awal hari” versi lokal (tanpa lib tambahan)
  dt.setMinutes(dt.getMinutes() + tzOffsetMinutes);
  dt.setHours(0, 0, 0, 0);
  dt.setMinutes(dt.getMinutes() - tzOffsetMinutes);
  return dt;
}
function startOfMonthLocal(d = new Date(), tzOffsetMinutes = 0) {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() + tzOffsetMinutes);
  dt.setDate(1);
  dt.setHours(0, 0, 0, 0);
  dt.setMinutes(dt.getMinutes() - tzOffsetMinutes);
  return dt;
}
function startOfYearLocal(d = new Date(), tzOffsetMinutes = 0) {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() + tzOffsetMinutes);
  dt.setMonth(0, 1);
  dt.setHours(0, 0, 0, 0);
  dt.setMinutes(dt.getMinutes() - tzOffsetMinutes);
  return dt;
}
function startOfLastMonthLocal(d = new Date(), tzOffsetMinutes = 0) {
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() - 1, 1); // tanggal 1 bulan lalu
  dt.setHours(0, 0, 0, 0);
  return new Date(dt.getTime() - tzOffsetMinutes * 60000);
}
function endOfLastMonthLocal(d = new Date(), tzOffsetMinutes = 0) {
  const dt = new Date(d);
  dt.setDate(0); // last day of prev month
  dt.setHours(23, 59, 59, 999);
  return new Date(dt.getTime() - tzOffsetMinutes * 60000);
}

// Safely convert Prisma Decimal | number | null | undefined → number
const num = (x) => (x == null ? 0 : Number(x));

export async function getSalesStats(req, res) {
  try {
    const jakartaOffset = 7 * 60;
    const now = new Date();

    const startToday = startOfDayLocal(now, jakartaOffset);
    const startMonth = startOfMonthLocal(now, jakartaOffset);
    const startYear = startOfYearLocal(now, jakartaOffset);
    const startLastMonth = startOfLastMonthLocal(now, jakartaOffset);
    const endLastMonth = endOfLastMonthLocal(now, jakartaOffset);

    const [todayAgg, mtdAgg, ytdAgg, lastMonthAgg, yearSummaryAgg] =
      await Promise.all([
        prisma.salesOrder.aggregate({
          _sum: { grandTotal: true },
          where: { soDate: { gte: startToday, lte: now } },
        }),
        prisma.salesOrder.aggregate({
          _sum: { grandTotal: true },
          where: { soDate: { gte: startMonth, lte: now } },
        }),
        prisma.salesOrder.aggregate({
          _sum: { grandTotal: true },
          where: { soDate: { gte: startYear, lte: now } },
        }),
        prisma.salesOrder.aggregate({
          _sum: { grandTotal: true },
          where: { soDate: { gte: startLastMonth, lte: endLastMonth } },
        }),
        prisma.salesOrder.aggregate({
          _sum: { grandTotal: true },
          where: { soDate: { gte: startYear, lte: now } },
        }),
      ]);

    const today = num(todayAgg._sum.grandTotal);
    const mtd = num(mtdAgg._sum.grandTotal);
    const ytd = num(ytdAgg._sum.grandTotal);
    const lastMonth = num(lastMonthAgg._sum.grandTotal);
    const yearSummary = num(yearSummaryAgg._sum.grandTotal);

    res.json({ today, mtd, ytd, lastMonth, yearSummary });
  } catch (err) {
    console.error("[getSalesStats] error:", err);
    res.status(500).json({ message: "Gagal mengambil statistik penjualan" });
  }
}

export async function getSalesOrderCount(req, res) {
  try {
    // tanggal awal = 1 Januari tahun ini
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    // tanggal akhir = 31 Desember tahun ini
    const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    const count = await prisma.salesOrder.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    res.json({ count });
  } catch (err) {
    console.error("[getSalesOrderCount] error:", err);
    res
      .status(500)
      .json({ message: "Gagal mengambil jumlah sales order tahun ini" });
  }
}

export async function getMonthlySales(req, res) {
  try {
    const months = parseInt(req.query.months) || 6; // default 12 bulan
    const now = new Date();

    // ambil dari x bulan lalu
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));
    startDate.setDate(1); // mulai dari awal bulan
    startDate.setHours(0, 0, 0, 0); // set ke awal hari

    // Set now ke akhir hari
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    // Query aggregate per bulan menggunakan parameterized query
    const sales = await prisma.$queryRaw`
      SELECT 
        EXTRACT(YEAR FROM "createdAt")::integer as year,
        EXTRACT(MONTH FROM "createdAt")::integer as month,
        COALESCE(SUM("grandTotal"), 0)::float as total
      FROM "SalesOrder"
      WHERE "createdAt" BETWEEN ${startDate} AND ${endDate}
      GROUP BY year, month
      ORDER BY year, month;
    `;

    // Simpan hasil query ke Map biar gampang lookup
    const monthlyMap = new Map();
    sales.forEach((s) => {
      const key = `${s.year}-${s.month}`;
      monthlyMap.set(key, parseFloat(s.total) || 0);
    });

    // Generate data lengkap per bulan (isi 0 kalau nggak ada)
    const monthlyData = [];
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      monthlyData.push({
        year,
        month,
        total: monthlyMap.get(key) || 0,
      });
    }

    res.json({ success: true, data: monthlyData });
  } catch (error) {
    console.error("Error getMonthlySales:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}