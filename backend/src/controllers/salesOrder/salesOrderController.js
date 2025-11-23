import { prisma } from "../../config/db.js";
import { Prisma } from "../../../prisma/generated/prisma/index.js";
import { toNum } from "../../lib/soUtils.js";

/** Ambil semua sales order */
export const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const search = decodeURIComponent(req.query.search?.trim() || ""); // PERBAIKAN: decode URI component
    const status = req.query.status?.trim() || "";
    const skip = (page - 1) * pageSize;

    // =============================
    //     BUILD WHERE CLAUSE
    // =============================
    const where = {};

    // =============================
    //     MULTI KEYWORD SEARCH
    // =============================
    if (search) {
      // PERBAIKAN: Decode URL component dan split dengan benar
      const decodedSearch = decodeURIComponent(search);
      const words = decodedSearch.split(" ").filter(Boolean);

      if (words.length > 0) {
        where.AND = words.map((word) => ({
          OR: [
            { soNumber: { contains: word, mode: "insensitive" } },
            {
              customer: {
                OR: [
                  { name: { contains: word, mode: "insensitive" } },
                  { branch: { contains: word, mode: "insensitive" } },
                ],
              },
            },
            { project: { name: { contains: word, mode: "insensitive" } } },
            { user: { name: { contains: word, mode: "insensitive" } } },
          ],
        }));
      }
    }

    // Status filter
    if (status && status !== "ALL") {
      where.status = status;
    }

    // =============================
    //     HITUNG TOTAL SESUAI FILTER
    // =============================
    const totalCount = await prisma.salesOrder.count({ where });

    const totalPages = Math.ceil(totalCount / pageSize);

    // =============================
    //     QUERY DATA SALES ORDER
    // =============================
    const salesOrders = await prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        project: true,
        user: true,
        items: { include: { product: true } },
        documents: true,
        spk: {
          include: {
            purchaseRequest: {
              select: {
                id: true,
                nomorPr: true,
                details: { select: { id: true, estimasiTotalHarga: true } },
                uangMuka: {
                  select: {
                    id: true,
                    nomor: true,
                    jumlah: true,
                    pertanggungjawaban: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { soDate: "desc" },
      skip,
      take: pageSize,
    });

    // =============================
    //          RESPONSE
    // =============================
    res.json({
      data: salesOrders,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("GET ALL SALES ORDER ERROR:", error);
    res.status(500).json({ message: "Gagal mengambil data Sales Order" });
  }
};

export const getAllSPK = async (req, res) => {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        project: true,
        user: true,
        items: { include: { product: true } },
        documents: true,
        spk: {
          include: {
            purchaseRequest: {
              select: {
                id: true,
                nomorPr: true,
                details: { select: { id: true, estimasiTotalHarga: true } },
                uangMuka: {
                  select: {
                    id: true,
                    nomor: true,
                    jumlah: true,
                    pertanggungjawaban: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { soDate: "desc" },
    });

    res.json({
      data: salesOrders,
      totalCount: salesOrders.length,
    });
  } catch (error) {
    console.error("GET ALL SALES ORDER ERROR:", error);
    res.status(500).json({ message: "Gagal mengambil data Sales Order" });
  }
};

export const getAllInvoice = async (req, res) => {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        status: {
          in: ["FULFILLED", "BAST"], // hanya ambil status ini
        },
      },
      include: {
        customer: true,
        project: true,
        user: true,
        items: { include: { product: true } },
        documents: true,
        spk: {
          select: {
            spkNumber: true,
            id: true,
          },
        },
      },
      orderBy: { soDate: "desc" },
    });

    res.json(salesOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data Sales Order" });
  }
};

export const getAllBap = async (req, res) => {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        status: {
          in: ["FULFILLED"], // hanya ambil status ini
        },
      },
      include: {
        customer: true,
        project: true,
        user: true,
        items: { include: { product: true } },
        documents: true,
        spk: {
          select: {
            spkNumber: true,
            spkDate: true,
            id: true,
          },
        },
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
    console.log("USER ID", req.user);

    // ✅ Check semua kemungkinan property names
    const possibleUserId =
      req.user?.userId ||
      req.user?.id ||
      req.user?.user_id ||
      req.user?.userID ||
      req.user?.UserID;

    if (!req.user || !possibleUserId) {
      return res.status(401).json({
        message: "Akses tidak sah. Silakan login.",
        debug: {
          userExists: !!req.user,
          userIdExists: !!possibleUserId,
          availableProperties: Object.keys(req.user || {}),
          userDetails: req.user,
        },
      });
    }
    const userId = possibleUserId;
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

    // OPTIMASI: Kumpulkan semua productId yang diperlukan
    const productIdsToFetch = [];
    const productIdToIndexMap = new Map();

    for (let i = 0; i < items.length; i++) {
      const it = items[i] ?? {};
      const itemType =
        typeof it.itemType === "string" ? it.itemType.toUpperCase() : "PRODUCT";

      if ((itemType === "PRODUCT" || itemType === "SERVICE") && it.productId) {
        productIdsToFetch.push(it.productId);
        productIdToIndexMap.set(it.productId, i);
      }
    }

    // OPTIMASI: Fetch semua produk sekaligus di luar transaksi
    let products = [];
    if (productIdsToFetch.length > 0) {
      products = await prisma.product.findMany({
        where: { id: { in: productIdsToFetch } },
        select: {
          id: true,
          name: true,
          usageUnit: true, // PERBAIKAN: Gunakan usageUnit sesuai schema Product
          description: true,
        },
      });
    }

    const productMap = new Map();
    products.forEach((product) => {
      productMap.set(product.id, product);
    });

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
      let uom = it.uom ?? it.usageUnit ?? null; // Support both uom and usageUnit from request

      if (itemType === "PRODUCT" || itemType === "SERVICE") {
        const needSnapshot = !name || !uom;
        if (needSnapshot) {
          const product = productMap.get(it.productId);
          if (!product) {
            return res.status(400).json({
              message: `Product/Service tidak ditemukan: ${it.productId}`,
            });
          }
          if (!name) name = product.name || undefined;
          // PERBAIKAN: Gunakan usageUnit dari product untuk dijadikan uom
          if (!uom) uom = product.usageUnit ?? null;
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
      discountTotal += qty * unitPrice - amt.net;
      taxTotal += amt.tax;
      grandTotal += amt.total;

      // FIX: Gunakan field yang sesuai dengan schema
      const itemData = {
        lineNo: idx,
        itemType,
        name,
        uom: uom, // PERBAIKAN: Gunakan uom untuk SalesOrderItem
        description: it.description ?? null,
        qty: new Prisma.Decimal(qty),
        unitPrice: new Prisma.Decimal(unitPrice),
        discount: new Prisma.Decimal(discount),
        taxRate: new Prisma.Decimal(taxRate),
        lineTotal: new Prisma.Decimal(amt.net),
      };

      // Only add product relation for PRODUCT and SERVICE types
      if (itemType === "PRODUCT" || itemType === "SERVICE") {
        itemData.product = {
          connect: { id: it.productId },
        };
      }

      preparedItems.push(itemData);
    }

    // Transaksi: create header + items + documents
    const created = await prisma.$transaction(
      async (tx) => {
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
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    usageUnit: true, // PERBAIKAN: Sesuaikan dengan schema Product
                    description: true,
                  },
                },
              },
            },
            documents: true,
          },
        });
        return so;
      },
      {
        timeout: 30000,
        maxWait: 30000,
      }
    );

    return res.status(201).json(created);
  } catch (error) {
    console.error("Error creating sales order in backend:", error);

    if (error.code === "P2028") {
      return res.status(500).json({
        message:
          "Transaksi timeout. Silakan coba lagi atau hubungi administrator.",
      });
    }

    if (
      error &&
      error.code === "P2002" &&
      error.meta &&
      error.meta.target &&
      error.meta.target.includes("soNumber")
    ) {
      return res.status(409).json({ message: "Nomor SO sudah digunakan." });
    }

    if (error.name === "PrismaClientValidationError") {
      return res.status(400).json({
        message: "Data tidak valid. Silakan periksa kembali input Anda.",
      });
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

    if (!id) return res.status(400).json({ message: "Missing SalesOrder id." });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Minimal 1 item diperlukan." });
    }

    // helper
    const toNum = (v) =>
      v === null || v === undefined || v === "" ? NaN : Number(v);
    const bad = (v) => Number.isNaN(v) || v === null || v === undefined;

    // --- NORMALISASI ITEMS ---
    const normalized = [];

    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx] || {};
      const rawType =
        typeof it.itemType === "string" ? it.itemType.toUpperCase() : "PRODUCT";
      const itemType =
        rawType === "SERVICE" || rawType === "CUSTOM" ? rawType : "PRODUCT";

      // productId wajib untuk PRODUCT dan SERVICE
      if ((itemType === "PRODUCT" || itemType === "SERVICE") && !it.productId) {
        return res.status(400).json({
          message: `productId wajib untuk item ${itemType}.`,
        });
      }

      let name = it.name;
      let uom = it.uom ?? null;

      if (
        (itemType === "PRODUCT" || itemType === "SERVICE") &&
        (!name || !uom)
      ) {
        // snapshot nama + uom
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

      if (!name || String(name).trim() === "") {
        return res
          .status(400)
          .json({ message: "Nama item (name) tidak boleh kosong." });
      }

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
      if (discount > bruto)
        return res.status(400).json({
          message: "Discount tidak boleh melebihi (qty × unitPrice).",
        });

      // bukti urutan
      const roughLine =
        Number.isInteger(it.lineNo) && it.lineNo > 0 ? it.lineNo : idx + 1;

      const neto = Math.max(bruto - discount, 0);
      const lineTotal = Math.max(neto + (taxRate / 100) * neto, 0);

      normalized.push({
        _roughLine: roughLine,
        id: it.id ?? null, // penting: item lama punya id
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

    // urutkan
    const sorted = normalized.sort((a, b) => a._roughLine - b._roughLine);

    // hitung total header
    const totals = sorted.reduce(
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
      // UPDATE HEADER
      const headerData = {};
      if (soNumber) headerData.soNumber = soNumber;
      if (soDate) headerData.soDate = new Date(soDate);
      if (customerId) headerData.customerId = customerId;

      // projectId wajib di model → update hanya bila ada
      if (projectId) headerData.projectId = projectId;

      if (type) headerData.type = type;
      if (status) headerData.status = status;
      if (typeof notes !== "undefined") headerData.notes = notes;

      if (Object.keys(headerData).length) {
        await tx.salesOrder.update({
          where: { id },
          data: headerData,
        });
      }

      // ✅ STANDAR UPDATE ITEMS dengan pengecekan referensi
      const keepIds = [];

      // Cek item yang akan dihapus apakah ada referensi di SPKFieldReport
      const existingItems = await tx.salesOrderItem.findMany({
        where: { salesOrderId: id },
        select: {
          id: true,
        },
      });

      const existingItemIds = existingItems.map((item) => item.id);
      const incomingItemIds = sorted
        .filter((item) => item.id)
        .map((item) => item.id);
      const itemsToDelete = existingItemIds.filter(
        (id) => !incomingItemIds.includes(id)
      );

      // Jika ada item yang akan dihapus, cek referensinya
      if (itemsToDelete.length > 0) {
        const referencedItems = await tx.sPKFieldReport.findMany({
          where: {
            soDetailId: { in: itemsToDelete },
          },
          select: {
            soDetailId: true,
          },
        });

        const referencedItemIds = [
          ...new Set(referencedItems.map((item) => item.soDetailId)),
        ];

        // Jika ada item yang direferensi, batalkan transaksi
        if (referencedItemIds.length > 0) {
          throw new Error(
            `Tidak dapat menghapus item yang sudah digunakan dalam SPK Field Report. Item IDs: ${referencedItemIds.join(
              ", "
            )}`
          );
        }
      }

      for (let i = 0; i < sorted.length; i++) {
        const it = sorted[i];

        if (it.id) {
          // --- UPDATE ---
          await tx.salesOrderItem.update({
            where: { id: it.id },
            data: {
              lineNo: i + 1,
              itemType: it.itemType,
              productId: it.productId,
              name: it.name,
              uom: it.uom,
              description: it.description,
              qty: new Prisma.Decimal(it.qty),
              unitPrice: new Prisma.Decimal(it.unitPrice),
              discount: new Prisma.Decimal(it.discount),
              taxRate: new Prisma.Decimal(it.taxRate),
              lineTotal: new Prisma.Decimal(it.lineTotal),
            },
          });
          keepIds.push(it.id);
        } else {
          // --- CREATE ---
          const newItem = await tx.salesOrderItem.create({
            data: {
              salesOrderId: id,
              lineNo: i + 1,
              itemType: it.itemType,
              productId: it.productId,
              name: it.name,
              uom: it.uom,
              description: it.description,
              qty: new Prisma.Decimal(it.qty),
              unitPrice: new Prisma.Decimal(it.unitPrice),
              discount: new Prisma.Decimal(it.discount),
              taxRate: new Prisma.Decimal(it.taxRate),
              lineTotal: new Prisma.Decimal(it.lineTotal),
            },
          });
          keepIds.push(newItem.id);
        }
      }

      // ✅ DELETE items lama yang tidak dikirim HANYA jika tidak ada referensi
      if (itemsToDelete.length > 0) {
        await tx.salesOrderItem.deleteMany({
          where: {
            salesOrderId: id,
            id: { in: itemsToDelete },
          },
        });
      }

      // update totals
      await tx.salesOrder.update({
        where: { id },
        data: {
          subtotal: new Prisma.Decimal(totals.subtotal),
          discountTotal: new Prisma.Decimal(totals.discountTotal),
          taxTotal: new Prisma.Decimal(totals.taxTotal),
          grandTotal: new Prisma.Decimal(totals.grandTotal),
        },
      });

      // return sales order lengkap
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

    if (error?.code === "P2003") {
      return res.status(409).json({
        message:
          "Tidak dapat menghapus item yang sudah digunakan dalam SPK Field Report.",
      });
    }

    if (error.message?.includes("SPK Field Report")) {
      return res.status(409).json({
        message: error.message,
      });
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
    let whereSql = `WHERE "soDate" >= $1 AND "soDate" <= $2 AND "status" <> 'CANCELLED'`;
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

// function startOfDayLocal(d = new Date(), tzOffsetMinutes = 0) {
//   const dt = new Date(d);
//   // Reset to UTC midnight then adjust for timezone
//   dt.setUTCHours(0, 0, 0, 0);
//   return new Date(dt.getTime() + tzOffsetMinutes * 60000);
// }

// function startOfMonthLocal(d = new Date(), tzOffsetMinutes = 0) {
//   const dt = new Date(d);
//   // Set to first day of month at UTC midnight, then adjust for timezone
//   dt.setUTCDate(1);
//   dt.setUTCHours(0, 0, 0, 0);
//   return new Date(dt.getTime() + tzOffsetMinutes * 60000);
// }

// function startOfYearLocal(d = new Date(), tzOffsetMinutes = 0) {
//   const dt = new Date(d);
//   // Set to first day of year at UTC midnight, then adjust for timezone
//   dt.setUTCMonth(0, 1);
//   dt.setUTCHours(0, 0, 0, 0);
//   return new Date(dt.getTime() + tzOffsetMinutes * 60000);
// }

// function startOfLastMonthLocal(d = new Date(), tzOffsetMinutes = 0) {
//   const dt = new Date(d);
//   // Go to first day of current month, then subtract one month
//   dt.setUTCDate(1);
//   dt.setUTCHours(0, 0, 0, 0);
//   dt.setUTCMonth(dt.getUTCMonth() - 1);
//   return new Date(dt.getTime() + tzOffsetMinutes * 60000);
// }

// function endOfLastMonthLocal(d = new Date(), tzOffsetMinutes = 0) {
//   const dt = new Date(d);
//   // Go to first day of current month, then subtract 1ms to get end of previous month
//   dt.setUTCDate(1);
//   dt.setUTCHours(0, 0, 0, 0);
//   const endOfLastMonth = new Date(dt.getTime() - 1);
//   return new Date(endOfLastMonth.getTime() + tzOffsetMinutes * 60000);
// }

// Safely convert Prisma Decimal | number | null | undefined → number

const num = (x) => (x == null ? 0 : Number(x));

export async function getSalesStats(req, res) {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0–11
    const currentDate = now.getDate();

    const startToday = new Date(
      currentYear,
      currentMonth,
      currentDate,
      0,
      0,
      0,
      0
    );
    const startMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const startYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const startLastMonth = new Date(prevMonthYear, prevMonth, 1, 0, 0, 0, 0);
    const endLastMonth = new Date(
      currentYear,
      currentMonth,
      0,
      23,
      59,
      59,
      999
    );

    // Kondisi umum untuk exclude DRAFT
    const notDraftCondition = {
      status: {
        not: { in: ["DRAFT", "CANCELLED"] },
      },
    };

    const [todayAgg, mtdAgg, ytdAgg, lastMonthAgg, yearSummaryAgg] =
      await Promise.all([
        prisma.salesOrder.aggregate({
          _sum: { grandTotal: true },
          where: {
            ...notDraftCondition,
            soDate: { gte: startToday, lte: now },
          },
        }),
        prisma.salesOrder.aggregate({
          _sum: { grandTotal: true },
          where: {
            ...notDraftCondition,
            soDate: { gte: startMonth, lte: now },
          },
        }),
        prisma.salesOrder.aggregate({
          _sum: { grandTotal: true },
          where: {
            ...notDraftCondition,
            soDate: { gte: startYear, lte: now },
          },
        }),
        prisma.salesOrder.aggregate({
          _sum: { grandTotal: true },
          where: {
            ...notDraftCondition,
            soDate: { gte: startLastMonth, lte: endLastMonth },
          },
        }),
        prisma.salesOrder.aggregate({
          _sum: { grandTotal: true },
          where: {
            ...notDraftCondition,
            soDate: { gte: startYear, lte: now },
          },
        }),
      ]);

    const today = Number(todayAgg._sum.grandTotal) || 0;
    const mtd = Number(mtdAgg._sum.grandTotal) || 0;
    const ytd = Number(ytdAgg._sum.grandTotal) || 0;
    const lastMonthTotal = Number(lastMonthAgg._sum.grandTotal) || 0;
    const yearSummary = Number(yearSummaryAgg._sum.grandTotal) || 0;

    res.json({
      today,
      mtd,
      ytd,
      lastMonth: lastMonthTotal,
      yearSummary,
    });
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
    const months = parseInt(req.query.months) || 6; // default 6 bulan
    const customerId = req.query.customerId; // ✅ Tambahkan ini

    const now = new Date();

    // Ambil dari x bulan lalu
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));
    startDate.setDate(1); // mulai dari awal bulan
    startDate.setHours(0, 0, 0, 0);

    // Set now ke akhir hari
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    // Siapkan WHERE clause dan parameter
    let whereClause = `"createdAt" BETWEEN $1 AND $2 AND "status" <> 'CANCELLED'`;
    const params = [startDate, endDate];

    if (customerId) {
      whereClause += ` AND "customerId" = $${params.length + 1}`;
      params.push(customerId);
    }

    // Query aggregate per bulan menggunakan parameterized query
    const sales = await prisma.$queryRawUnsafe(
      `
      SELECT 
        EXTRACT(YEAR FROM "createdAt")::integer as year,
        EXTRACT(MONTH FROM "createdAt")::integer as month,
        COALESCE(SUM("grandTotal"), 0)::float as total
      FROM "SalesOrder"
      WHERE ${whereClause}
      GROUP BY year, month
      ORDER BY year, month;
      `,
      ...params
    );

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
