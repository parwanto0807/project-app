import { prisma } from "../../config/db.js";

/**
 * Helper function to convert month number to Roman numerals
 */
const monthToRoman = (month) => {
  const romanNumerals = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
    7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
  };
  return romanNumerals[month] || 'I';
};

/**
 * Generate PO Number with format: 000001/PO-RYLIF/XII/2025
 * Sequential number resets every year
 */
const generatePONumber = async (db) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const romanMonth = monthToRoman(month);

  // Get the start and end of the current year
  const startOfYear = new Date(year, 0, 1); // January 1st
  const endOfYear = new Date(year, 11, 31, 23, 59, 59); // December 31st

  // Count POs created in current year
  const countThisYear = await db.purchaseOrder.count({
    where: {
      orderDate: {
        gte: startOfYear,
        lte: endOfYear
      }
    }
  });

  // Sequential number (6 digits, padded with zeros)
  const sequentialNumber = (countThisYear + 1).toString().padStart(6, '0');

  // Format: 000001/PO-RYLIF/XII/2025
  return `${sequentialNumber}/PO-RYLIF/${romanMonth}/${year}`;
};

/**
 * @desc Create PO from Approved PR (Auto-called when PR is approved)
 * This function creates a Purchase Order for items with sourceProduct = 'PEMBELIAN_BARANG'
 */
export const createPOFromApprovedPR = async (prId, tx) => {
  const db = tx || prisma;

  // 1. Fetch PR data with details
  const pr = await db.purchaseRequest.findUnique({
    where: { id: prId },
    include: { 
      details: {
        include: {
          product: true
        }
      },
      karyawan: true
    }
  });

  if (!pr) {
    throw new Error("Purchase Request tidak ditemukan");
  }

  // 2. Filter only purchase items (PEMBELIAN_BARANG)
  const purchaseItems = pr.details.filter(
    detail => detail.sourceProduct === 'PEMBELIAN_BARANG'
  );

  // If no purchase items, don't create PO
  if (purchaseItems.length === 0) {
    return null;
  }

  // 3. Generate PO Number (Format: 000001/PO-RYLIF/XII/2025)
  const poNumber = await generatePONumber(db);

  // 4. Calculate subtotal from purchase items
  const subtotal = purchaseItems.reduce((sum, item) => {
    return sum + Number(item.estimasiTotalHarga || 0);
  }, 0);

  // 5. Get first warehouse from allocations or use a placeholder
  // This is a temporary solution - purchasing team will update it manually
  let defaultWarehouseId = null;
  
  // Try to get warehouse from first item's allocation
  if (purchaseItems[0]?.warehouseAllocation) {
    const allocations = typeof purchaseItems[0].warehouseAllocation === 'string'
      ? JSON.parse(purchaseItems[0].warehouseAllocation)
      : purchaseItems[0].warehouseAllocation;
    
    if (Array.isArray(allocations) && allocations.length > 0) {
      defaultWarehouseId = allocations[0].warehouseId;
    }
  }

  // If still no warehouse, get the first active warehouse
  if (!defaultWarehouseId) {
    const firstWarehouse = await db.warehouse.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    defaultWarehouseId = firstWarehouse?.id;
  }

  if (!defaultWarehouseId) {
    throw new Error("Tidak ada gudang aktif yang tersedia untuk PO");
  }

  // 6. Get first active supplier as placeholder
  const firstSupplier = await db.supplier.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true }
  });

  if (!firstSupplier) {
    throw new Error("Tidak ada supplier aktif yang tersedia untuk PO");
  }

  // 7. Create PO in DRAFT status
  const po = await db.purchaseOrder.create({
    data: {
      poNumber,
      orderDate: new Date(),
      status: 'DRAFT',
      purchaseRequestId: pr.id,
      projectId: pr.projectId,
      orderedById: pr.karyawanId,
      supplierId: firstSupplier.id, // Placeholder - needs manual update
      warehouseId: defaultWarehouseId,
      subtotal,
      taxAmount: 0,
      totalAmount: subtotal,
      lines: {
        create: purchaseItems.map(item => ({
          productId: item.productId,
          description: item.product?.name || 'Item',
          quantity: item.jumlah,
          unitPrice: item.estimasiHargaSatuan || 0,
          totalAmount: item.estimasiTotalHarga || 0,
          prDetailId: item.id
        }))
      }
    },
    include: {
      lines: {
        include: {
          product: true
        }
      },
      supplier: true,
      warehouse: true,
      project: true
    }
  });

  return po;
};

/**
 * @desc Create PO Manually (from form)
 * This is for creating a PO directly without a PR
 */
export const createPO = async (req, res) => {
  try {
    const {
      poNumber,
      orderDate,
      expectedDeliveryDate,
      warehouseId,
      supplierId,
      projectId,
      spkId, // Added SPK ID
      notes,
      subtotal,
      taxAmount,
      totalAmount,
      status,
      paymentTerm, // Added paymentTerm
      lines
    } = req.body;

    // Validate request user (auth check)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - User not authenticated"
      });
    }

    // Validate required fields
    if (!supplierId || !warehouseId || !lines || lines.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Supplier, Warehouse, dan minimal 1 item harus diisi"
      });
    }

    // Get Karyawan ID from User ID (logged in user)
    const userKaryawan = await prisma.karyawan.findUnique({
      where: { userId: req.user.id },
    });

    if (!userKaryawan) {
      return res.status(400).json({
        success: false,
        error: "User Anda tidak terhubung dengan data Karyawan. Hubungi admin."
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Generate PO Number if not provided
      let finalPoNumber = poNumber;
      if (!finalPoNumber) {
        finalPoNumber = await generatePONumber(tx);
      }

      // Create PO
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber: finalPoNumber,
          orderDate: new Date(orderDate),
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
          status: status || 'DRAFT',
          paymentTerm: paymentTerm || 'COD', // Use provided paymentTerm or default
          warehouseId,
          supplierId,
          projectId: projectId || null,
          sPKId: spkId || null, // Save SPK reference
          orderedById: userKaryawan.id, // Use the correct Karyawan ID
          subtotal: Number(subtotal),
          taxAmount: Number(taxAmount || 0),
          totalAmount: Number(totalAmount),
          lines: {
            create: lines.map(line => ({
              productId: line.productId,
              description: line.description || '',
              quantity: Number(line.quantity),
              unitPrice: Number(line.unitPrice),
              totalAmount: Number(line.totalAmount),
            }))
          }
        },
        include: {
          lines: {
            include: {
              product: true
            }
          },
          supplier: true,
          warehouse: true,
          project: true,
          SPK: true
        }
      });

      return po;
    });

    return res.status(201).json({
      success: true,
      message: "Purchase Order berhasil dibuat",
      data: result
    });
  } catch (error) {
    console.error("Error creating PO:", error);
    return res.status(500).json({
      success: false,
      error: "Gagal membuat Purchase Order",
      details: error.message
    });
  }
};

/**
 * @desc Create PO from Approved PR (Legacy function - kept for compatibility)
 * Logika ini biasanya dipanggil didalam transaction approvePR
 */
export const createPOFromPR = async (prId, userId, tx) => {
  const db = tx || prisma;

  // 1. Ambil data PR
  const pr = await db.purchaseRequest.findUnique({
    where: { id: prId },
    include: { items: true }
  });

  if (!pr) throw new Error("Purchase Request tidak ditemukan");

  // 2. Generate Nomor PO (Format: 000001/PO-RYLIF/XII/2025)
  const poNumber = await generatePONumber(db);

  // 3. Buat PO Draft
  return await db.purchaseOrder.create({
    data: {
      poNumber,
      orderDate: new Date(),
      status: 'DRAFT',
      purchaseRequestId: pr.id,
      projectId: pr.projectId,
      orderedById: userId,
      supplierId: "DEFAULT_SUPPLIER_ID", // Perlu diupdate manual oleh purchasing
      warehouseId: "DEFAULT_WAREHOUSE_ID", // Perlu diupdate manual oleh purchasing
      lines: {
        create: pr.items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: 0, // Akan diisi saat editing draft
          totalAmount: 0,
          prDetailId: item.id
        }))
      }
    }
  });
};

/**
 * @desc Get All Purchase Orders with Pagination
 */
export const getAllPO = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      OR: [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } }
      ]
    };

    const [data, totalCount] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: Number(limit),
        include: { 
          supplier: true, 
          project: true, 
          orderedBy: true,
          warehouse: true,
          PurchaseRequest: {
            select: {
              id: true,
              nomorPr: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.purchaseOrder.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / Number(limit));

    const response = {
      data,
      pagination: {
        totalCount,
        totalPages,
        currentPage: Number(page),
        pageSize: Number(limit),
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    };

    return res.status(200).json({ success: true, ...response });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: "Gagal mengambil data PO", 
      details: error.message 
    });
  }
};

/**
 * @desc Update PO Draft (Isi Harga & Supplier)
 */
export const updatePO = async (req, res) => {
  const { id } = req.params;
  const { supplierId, warehouseId, lines, taxAmount, shippingCost } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get existing lines to determine deletions
      const existingLines = await tx.purchaseOrderLine.findMany({
        where: { poId: id },
        select: { id: true }
      });
      const existingIds = existingLines.map(l => l.id);
      
      // IDs present in the request
      const inputIds = lines.filter(l => l.id).map(l => l.id);
      
      // IDs to delete (in DB but not in Request)
      const idsToDelete = existingIds.filter(id => !inputIds.includes(id));
      
      if (idsToDelete.length > 0) {
        await tx.purchaseOrderLine.deleteMany({
          where: { id: { in: idsToDelete } }
        });
      }

      // 2. Upsert (Update existing, Create new)
      for (const line of lines) {
        const lineTotal = Number(line.quantity) * Number(line.unitPrice);
        
        if (line.id) {
          // Update existing
          await tx.purchaseOrderLine.update({
            where: { id: line.id },
            data: {
              productId: line.productId,
              description: line.description || '',
              quantity: Number(line.quantity),
              unitPrice: Number(line.unitPrice),
              totalAmount: lineTotal
            }
          });
        } else {
          // Create new
          await tx.purchaseOrderLine.create({
            data: {
              poId: id,
              productId: line.productId,
              description: line.description || '',
              quantity: Number(line.quantity),
              unitPrice: Number(line.unitPrice),
              totalAmount: lineTotal
            }
          });
        }
      }

      // 3. Hitung Subtotal ulang
      const updatedLines = await tx.purchaseOrderLine.findMany({ where: { poId: id } });
      const subtotal = updatedLines.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
      const totalAmount = subtotal + Number(taxAmount || 0) + Number(shippingCost || 0);

      // 4. Update Header
      return await tx.purchaseOrder.update({
        where: { id },
        data: {
          supplier: { connect: { id: supplierId } },
          warehouse: { connect: { id: warehouseId } },
          subtotal,
          taxAmount: Number(taxAmount || 0),
          totalAmount,
          status: 'SENT' // Otomatis naik status setelah diupdate
        }
      });
    });

    return res.status(200).json({ success: true, data: result, message: "PO berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating PO:", error);
    return res.status(400).json({ success: false, error: "Gagal update PO", details: error.message });
  }
};

export const getPODetail = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        project: true,
        warehouse: true,
        orderedBy: true,
        PurchaseRequest: true,
        SPK: true,
        lines: {
          include: {
            product: true
          }
        },
        goodsReceipts: true
      }
    });

    if (!data) {
      return res.status(404).json({ success: false, error: "PO tidak ditemukan" });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: "Gagal mengambil detail PO", 
      details: error.message 
    });
  }
};

/**
 * @desc Update PO Status (Approve, Cancel, Close)
 */
export const updatePOStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Misal: APPROVED, CANCELLED, CLOSED

  try {
    // Validasi sederhana: Jika membatalkan PO, pastikan belum ada penerimaan barang
    if (status === 'CANCELLED') {
      const hasReceipts = await prisma.goodsReceipt.findFirst({
        where: { poId: id }
      });
      if (hasReceipts) {
        return res.status(400).json({ 
          success: false, 
          error: "PO tidak bisa dibatalkan karena sudah ada penerimaan barang." 
        });
      }
    }

    const result = await prisma.purchaseOrder.update({
      where: { id },
      data: { status }
    });

    return res.status(200).json({ 
      success: true, 
      data: result, 
      message: `Status PO berhasil diubah menjadi ${status}` 
    });
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      error: "Gagal update status PO", 
      details: error.message 
    });
  }
};

/**
 * @desc Delete Purchase Order (Hanya untuk status DRAFT)
 */
export const deletePO = async (req, res) => {
  const { id } = req.params;

  try {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });

    if (!po) {
      return res.status(404).json({ success: false, error: "PO tidak ditemukan" });
    }

    if (po.status !== 'DRAFT') {
      return res.status(400).json({ 
        success: false, 
        error: "Hanya PO berstatus DRAFT yang dapat dihapus." 
      });
    }

    await prisma.purchaseOrder.delete({
      where: { id }
    });

    return res.status(200).json({ 
      success: true, 
      message: "PO berhasil dihapus permanen" 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: "Gagal menghapus PO", 
      details: error.message 
    });
  }
};