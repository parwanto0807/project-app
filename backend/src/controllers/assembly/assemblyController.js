import { prisma } from "../../config/db.js";
import { getPeriodDate } from "../../utils/dateUtils.js";

const toNumber = (val) => {
  if (val === null || val === undefined) return 0;
  return typeof val.toNumber === "function" ? val.toNumber() : Number(val);
};

/**
 * Generate assembly number (Format: ASM-YYYYMM-XXXX)
 */
const generateAssemblyNumber = async (tx) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `ASM-${year}${month}`;

  const last = await tx.assemblyOrder.findFirst({
    where: { assemblyNumber: { startsWith: prefix } },
    orderBy: { assemblyNumber: "desc" },
    select: { assemblyNumber: true },
  });

  let sequence = 1;
  if (last) {
    const parts = last.assemblyNumber.split("-");
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
};

/**
 * Convert a quantity from a given unit to the product's storage unit.
 */
const toStorageUnit = (qty, unit, product) => {
  let qtyInStorage = parseFloat(qty) || 0;

  if (unit === product.usageUnit && product.usageUnit !== product.storageUnit) {
    const conversion = Number(product.conversionToUsage) || 1;
    qtyInStorage = (parseFloat(qty) || 0) / conversion;
  } else if (
    unit === product.purchaseUnit &&
    product.purchaseUnit !== product.storageUnit
  ) {
    const conversion = Number(product.conversionToStorage) || 1;
    qtyInStorage = (parseFloat(qty) || 0) * conversion;
  }

  return qtyInStorage;
};

/**
 * @desc Get all assembly orders (with pagination & filters)
 * @route GET /api/assembly
 */
export const getAllAssemblies = async (req, res) => {
  try {
    const { search, status, warehouseId, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (warehouseId && warehouseId !== "all") {
      where.warehouseId = warehouseId;
    }

    if (search) {
      where.OR = [
        { assemblyNumber: { contains: search.trim(), mode: "insensitive" } },
        {
          outputProduct: {
            OR: [
              { code: { contains: search.trim(), mode: "insensitive" } },
              { name: { contains: search.trim(), mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [data, totalCount] = await Promise.all([
      prisma.assemblyOrder.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          warehouse: { select: { id: true, code: true, name: true } },
          outputProduct: {
            select: { id: true, code: true, name: true, storageUnit: true },
          },
          createdBy: { select: { id: true, namaLengkap: true } },
          components: {
            include: {
              product: {
                select: { id: true, code: true, name: true, storageUnit: true },
              },
            },
          },
        },
      }),
      prisma.assemblyOrder.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        data,
        pagination: {
          totalCount,
          totalPages,
          currentPage: pageNum,
          pageSize: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get All Assemblies Error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: error.message,
    });
  }
};

/**
 * @desc Get single assembly order by id
 * @route GET /api/assembly/:id
 */
export const getAssemblyById = async (req, res) => {
  try {
    const { id } = req.params;

    const assembly = await prisma.assemblyOrder.findUnique({
      where: { id },
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        outputProduct: {
          select: { id: true, code: true, name: true, storageUnit: true },
        },
        createdBy: { select: { id: true, namaLengkap: true } },
        components: {
          include: {
            product: {
              select: { id: true, code: true, name: true, storageUnit: true },
            },
          },
        },
      },
    });

    if (!assembly) {
      return res
        .status(404)
        .json({ success: false, message: "Perakitan tidak ditemukan" });
    }

    return res.status(200).json({ success: true, data: assembly });
  } catch (error) {
    console.error("Get Assembly By Id Error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: error.message,
    });
  }
};

/**
 * @desc Create new assembly order (status DRAFT)
 * @route POST /api/assembly
 */
export const createAssembly = async (req, res) => {
  const { warehouseId, outputProductId, outputQuantity, outputUnit, outputCogs, notes, components, createdById } = req.body;

  try {
    if (!warehouseId || !outputProductId || !components || components.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (warehouseId, outputProductId, components)",
      });
    }

    const validComponents = components.filter(
      (c) => c.productId && Number(c.quantity) > 0
    );
    if (validComponents.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Minimal 1 komponen harus diisi",
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const assemblyNumber = await generateAssemblyNumber(tx);

        const assembly = await tx.assemblyOrder.create({
          data: {
            assemblyNumber,
            warehouseId,
            outputProductId,
            outputQuantity: parseFloat(outputQuantity) || 1,
            outputUnit: outputUnit || (await tx.product.findUnique({ where: { id: outputProductId } })).storageUnit,
            outputCogs: parseFloat(outputCogs) || 0,
            notes: notes || null,
            createdById: createdById || null,
            status: "DRAFT",
            components: {
              create: validComponents.map((c) => ({
                productId: c.productId,
                quantity: parseFloat(c.quantity),
                unit: c.unit || "",
                cogs: parseFloat(c.cogs) || 0,
              })),
            },
          },
          include: {
            warehouse: true,
            outputProduct: true,
            createdBy: true,
            components: { include: { product: true } },
          },
        });

        return assembly;
      },
      { timeout: 30000, maxWait: 35000 }
    );

    return res.status(201).json({
      success: true,
      message: "Perakitan berhasil dibuat (DRAFT)",
      data: result,
    });
  } catch (error) {
    console.error("Create Assembly Error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: error.message,
    });
  }
};

/**
 * @desc Complete assembly order:
 *       1. Deduct components from warehouse stock
 *       2. Add assembled product (output) to warehouse stock
 * @route POST /api/assembly/:id/complete
 */
export const completeAssembly = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const assembly = await tx.assemblyOrder.findUnique({
          where: { id },
          include: { components: true },
        });

        if (!assembly) {
          throw new Error("Perakitan tidak ditemukan");
        }

        if (assembly.status !== "DRAFT") {
          throw new Error(`Perakitan hanya bisa diselesaikan dari status DRAFT (saat ini: ${assembly.status})`);
        }

        const outputProduct = await tx.product.findUnique({
          where: { id: assembly.outputProductId },
        });

        if (!outputProduct) {
          throw new Error("Produk hasil perakitan tidak ditemukan");
        }

        const outputQtyInStorage = toStorageUnit(
          assembly.outputQuantity,
          assembly.outputUnit,
          outputProduct
        );

        // outputCogs disimpan sebagai TOTAL biaya komponen.
        // Harga per unit = total / jumlah hasil (untuk penilaian stock & stockDetail).
        const totalOutputCogs = toNumber(assembly.outputCogs);
        const unitCogs = totalOutputCogs / (toNumber(assembly.outputQuantity) || 1);

        // 1. Deduct each component
        for (const comp of assembly.components) {
          const product = await tx.product.findUnique({
            where: { id: comp.productId },
            select: {
              id: true,
              code: true,
              name: true,
              storageUnit: true,
              usageUnit: true,
              purchaseUnit: true,
              conversionToUsage: true,
              conversionToStorage: true,
            },
          });

          if (!product) {
            throw new Error(`Komponen ${comp.productId} tidak ditemukan`);
          }

          const qtyInStorage = toStorageUnit(comp.quantity, comp.unit, product);

          const sourceBalance = await tx.stockBalance.findFirst({
            where: {
              productId: comp.productId,
              warehouseId: assembly.warehouseId,
            },
            orderBy: { updatedAt: "desc" },
          });

          if (!sourceBalance) {
            throw new Error(`Stok tidak ditemukan untuk ${product.code} di gudang`);
          }

          if (toNumber(sourceBalance.availableStock) < qtyInStorage) {
            throw new Error(
              `Stok tidak mencukupi untuk komponen ${product.code}. Available: ${toNumber(sourceBalance.availableStock)}, Required: ${qtyInStorage}`
            );
          }

          await tx.stockBalance.update({
            where: { id: sourceBalance.id },
            data: {
              stockOut: { increment: qtyInStorage },
              stockAkhir: { decrement: qtyInStorage },
              availableStock: { decrement: qtyInStorage },
              inventoryValue: { decrement: qtyInStorage * toNumber(comp.cogs) },
            },
          });

          await tx.stockDetail.create({
            data: {
              productId: comp.productId,
              warehouseId: assembly.warehouseId,
              type: "OUT",
              source: "ASSEMBLY",
              transQty: toNumber(comp.quantity),
              transUnit: comp.unit,
              baseQty: qtyInStorage,
              pricePerUnit: toNumber(comp.cogs),
              referenceNo: assembly.assemblyNumber,
              residualQty: 0,
              stockAwalSnapshot: toNumber(sourceBalance.stockAkhir),
              stockAkhirSnapshot: toNumber(sourceBalance.stockAkhir) - qtyInStorage,
              notes: `Komponen perakitan ${assembly.assemblyNumber}`,
            },
          });
        }

        // 2. Add output product stock
        let destBalance = await tx.stockBalance.findFirst({
          where: {
            productId: assembly.outputProductId,
            warehouseId: assembly.warehouseId,
          },
          orderBy: { updatedAt: "desc" },
        });

        if (!destBalance) {
          destBalance = await tx.stockBalance.create({
            data: {
              productId: assembly.outputProductId,
              warehouseId: assembly.warehouseId,
              period: getPeriodDate(),
              stockAwal: 0,
              stockIn: 0,
              stockOut: 0,
              justIn: 0,
              justOut: 0,
              stockAkhir: 0,
              bookedStock: 0,
              availableStock: 0,
              inventoryValue: 0,
            },
          });
        }

        await tx.stockBalance.update({
          where: { id: destBalance.id },
          data: {
            stockIn: { increment: outputQtyInStorage },
            stockAkhir: { increment: outputQtyInStorage },
            availableStock: { increment: outputQtyInStorage },
            inventoryValue: {
              increment: totalOutputCogs,
            },
          },
        });

        await tx.stockDetail.create({
          data: {
            productId: assembly.outputProductId,
            warehouseId: assembly.warehouseId,
            type: "IN",
            source: "ASSEMBLY",
            transQty: toNumber(assembly.outputQuantity),
            transUnit: assembly.outputUnit,
            baseQty: outputQtyInStorage,
            pricePerUnit: unitCogs,
            referenceNo: assembly.assemblyNumber,
            residualQty: outputQtyInStorage,
            stockAwalSnapshot: toNumber(destBalance.stockAkhir),
            stockAkhirSnapshot: toNumber(destBalance.stockAkhir) + outputQtyInStorage,
            notes: `Hasil perakitan ${assembly.assemblyNumber}`,
          },
        });

        const updated = await tx.assemblyOrder.update({
          where: { id },
          data: { status: "COMPLETED" },
          include: {
            warehouse: true,
            outputProduct: true,
            createdBy: true,
            components: { include: { product: true } },
          },
        });

        return updated;
      },
      { timeout: 30000, maxWait: 35000 }
    );

    return res.status(200).json({
      success: true,
      message: "Perakitan berhasil diselesaikan",
      data: result,
    });
  } catch (error) {
    console.error("Complete Assembly Error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: error.message,
    });
  }
};

/**
 * @desc Cancel assembly order (only DRAFT)
 * @route POST /api/assembly/:id/cancel
 */
export const cancelAssembly = async (req, res) => {
  const { id } = req.params;

  try {
    const assembly = await prisma.assemblyOrder.findUnique({ where: { id } });

    if (!assembly) {
      return res.status(404).json({ success: false, message: "Perakitan tidak ditemukan" });
    }

    if (assembly.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Perakitan yang sudah selesai tidak bisa dibatalkan",
      });
    }

    const updated = await prisma.assemblyOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return res.status(200).json({
      success: true,
      message: "Perakitan dibatalkan",
      data: updated,
    });
  } catch (error) {
    console.error("Cancel Assembly Error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: error.message,
    });
  }
};
