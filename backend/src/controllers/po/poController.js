import { prisma } from "../../config/db.js";
import QRCode from "qrcode";

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
 * This function creates Purchase Orders for items with sourceProduct = 'PEMBELIAN_BARANG' or 'JASA_PEMBELIAN'
 * If both types exist, it creates 2 separate POs
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

  // 2. Separate items by sourceProduct type
  const pembelianBarangItems = pr.details.filter(
    detail => detail.sourceProduct === 'PEMBELIAN_BARANG'
  );
  
  const jasaPembelianItems = pr.details.filter(
    detail => detail.sourceProduct === 'JASA_PEMBELIAN'
  );

  // If no purchase items at all, don't create PO
  if (pembelianBarangItems.length === 0 && jasaPembelianItems.length === 0) {
    return null;
  }

  // 3. Helper function to get warehouse ID
  const getWarehouseId = async (items) => {
    let warehouseId = null;
    
    // Try to get warehouse from first item's allocation
    if (items[0]?.warehouseAllocation) {
      const allocations = typeof items[0].warehouseAllocation === 'string'
        ? JSON.parse(items[0].warehouseAllocation)
        : items[0].warehouseAllocation;
      
      if (Array.isArray(allocations) && allocations.length > 0) {
        warehouseId = allocations[0].warehouseId;
      }
    }

    // If still no warehouse, get the first active warehouse
    if (!warehouseId) {
      const firstWarehouse = await db.warehouse.findFirst({
        where: { isActive: true },
        select: { id: true }
      });
      warehouseId = firstWarehouse?.id;
    }

    if (!warehouseId) {
      throw new Error("Tidak ada gudang aktif yang tersedia untuk PO");
    }

    return warehouseId;
  };

  // 4. Get first active supplier as placeholder
  const firstSupplier = await db.supplier.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true }
  });

  if (!firstSupplier) {
    throw new Error("Tidak ada supplier aktif yang tersedia untuk PO");
  }

  // 5. Create PO(s) based on item types
  const createdPOs = [];

  // Create PO for PEMBELIAN_BARANG items
  if (pembelianBarangItems.length > 0) {
    const poNumber = await generatePONumber(db);
    const subtotal = pembelianBarangItems.reduce((sum, item) => {
      return sum + Number(item.estimasiTotalHarga || 0);
    }, 0);
    const warehouseId = await getWarehouseId(pembelianBarangItems);

    const po = await db.purchaseOrder.create({
      data: {
        poNumber,
        orderDate: new Date(),
        status: 'DRAFT',
        purchaseRequestId: pr.id,
        projectId: pr.projectId,
        orderedById: pr.karyawanId,
        supplierId: firstSupplier.id,
        warehouseId,
        subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        lines: {
          create: pembelianBarangItems.map(item => ({
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

    createdPOs.push(po);
    console.log(`✅ Created PO ${poNumber} for PEMBELIAN_BARANG items (${pembelianBarangItems.length} items)`);
  }

  // Create PO for JASA_PEMBELIAN items
  if (jasaPembelianItems.length > 0) {
    const poNumber = await generatePONumber(db);
    const subtotal = jasaPembelianItems.reduce((sum, item) => {
      return sum + Number(item.estimasiTotalHarga || 0);
    }, 0);
    const warehouseId = await getWarehouseId(jasaPembelianItems);

    const po = await db.purchaseOrder.create({
      data: {
        poNumber,
        orderDate: new Date(),
        status: 'DRAFT',
        purchaseRequestId: pr.id,
        projectId: pr.projectId,
        orderedById: pr.karyawanId,
        supplierId: firstSupplier.id,
        warehouseId,
        subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        lines: {
          create: jasaPembelianItems.map(item => ({
            productId: item.productId,
            description: item.product?.name || 'Item',
            quantity: item.jumlah,
            unitPrice: item.estimasiHargaSatuan || 0,
            totalAmount: item.estimasiTotalHarga || 0,
            prDetailId: item.id,
            notGr: true // Services don't require Goods Receipt
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

    createdPOs.push(po);
    console.log(`✅ Created PO ${poNumber} for JASA_PEMBELIAN items (${jasaPembelianItems.length} items)`);
  }

  // 6. Return result
  // If only one PO created, return it directly (backward compatible)
  // If multiple POs created, return array with summary
  if (createdPOs.length === 1) {
    return createdPOs[0];
  } else if (createdPOs.length > 1) {
    return {
      multiple: true,
      pos: createdPOs,
      summary: `Created ${createdPOs.length} POs: ${createdPOs.map(po => po.poNumber).join(', ')}`
    };
  }

  return null;
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
    const { page = 1, limit = 10, search = '', status, supplierId, hasNotGr, minStatus } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};

    // Filter by Search
    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Filter by Status
    if (status) {
      where.status = status;
    }

    // ✅ NEW FILTER: Filter by minimum status (e.g., SENT or higher)
    // Status hierarchy: DRAFT < PENDING_APPROVAL < APPROVED < SENT < PARTIALLY_RECEIVED < FULLY_RECEIVED
    if (minStatus) {
      const statusHierarchy = [
        'DRAFT',
        'PENDING_APPROVAL', 
        'REVISION_NEEDED',
        'APPROVED',
        'SENT',
        'PARTIALLY_RECEIVED',
        'FULLY_RECEIVED',
        'CANCELLED',
        'REJECTED'
      ];
      
      const minIndex = statusHierarchy.indexOf(minStatus);
      if (minIndex !== -1) {
        // Get all statuses from minStatus onwards (excluding CANCELLED and REJECTED)
        const validStatuses = statusHierarchy.slice(minIndex).filter(s => s !== 'CANCELLED' && s !== 'REJECTED');
        where.status = { in: validStatuses };
      }
    }

    // Filter by Supplier
    if (supplierId) {
      where.supplierId = supplierId;
    }

    // ✅ NEW FILTER: Filter by POs that have service items (notGr=true)
    if (hasNotGr === 'true') {
      where.lines = {
        some: {
          notGr: true
        }
      };
    }

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
          lines: {
            select: {
              id: true,
              checkPurchaseExecution: true,
              notGr: true // Include notGr field in response
            }
          },
          PurchaseRequest: {
            select: {
              id: true,
              nomorPr: true
            }
          },
          supplierInvoices: {
            select: {
              id: true,
              status: true,
              totalAmount: true
            }
          },
          PurchaseExecution: {
            select: {
              id: true,
              executionDate: true,
              status: true,
              receipts: {
                select: {
                  id: true,
                  receiptNumber: true,
                  storeName: true
                }
              }
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
  const { 
    supplierId, 
    warehouseId, 
    projectId,
    spkId,
    orderDate,
    expectedDeliveryDate,
    paymentTerm,
    notes,
    lines, 
    taxAmount, 
    shippingCost 
  } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get existing lines to determine deletions
      // Only process lines if they are provided in the request
      if (lines && Array.isArray(lines)) {
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
      }

      // 3. Hitung Subtotal ulang
      const updatedLines = await tx.purchaseOrderLine.findMany({ where: { poId: id } });
      const subtotal = updatedLines.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
      const totalAmount = subtotal + Number(taxAmount || 0) + Number(shippingCost || 0);

      // 4. Prepare update data
      const updateData = {
        subtotal,
        taxAmount: Number(taxAmount || 0),
        totalAmount,
      };

      // Add optional fields if provided
      if (supplierId) {
        updateData.supplier = { connect: { id: supplierId } };
      }
      if (warehouseId) {
        updateData.warehouse = { connect: { id: warehouseId } };
      }
      if (projectId !== undefined) {
        // Use Prisma relation syntax
        updateData.project = projectId ? { connect: { id: projectId } } : { disconnect: true };
      }
      if (spkId !== undefined) {
        // Use Prisma relation syntax
        updateData.SPK = spkId ? { connect: { id: spkId } } : { disconnect: true };
      }
      if (req.body.teamId !== undefined) {
         // Update Team relation
         updateData.team = req.body.teamId ? { connect: { id: req.body.teamId } } : { disconnect: true };
      }
      if (orderDate) {
        updateData.orderDate = new Date(orderDate);
      }
      if (expectedDeliveryDate !== undefined) {
        updateData.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;
      }
      if (paymentTerm) {
        updateData.paymentTerm = paymentTerm;
      }
      // Note: 'notes' field doesn't exist in PurchaseOrder schema

      // 5. Update Header (status tetap tidak berubah saat edit)
      return await tx.purchaseOrder.update({
        where: { id },
        data: updateData
      });
    });

    // ✅ NOTIFIKASI KE TEAM JIKA ADA PENUGASAN BARU
    // ✅ NOTIFIKASI KE TEAM JIKA ADA PENUGASAN BARU
    if (req.body.teamId) {
      try {
        const { NotificationService } = await import(
          "../../utils/firebase/notificationService.js"
        );

        console.log(`📢 Sending PO notification to Team ${req.body.teamId}`);

        // 1. Notify Team Members
        await NotificationService.broadcastToTeamMembers(req.body.teamId, {
          title: "Tugas Baru: Purchase Order 📦",
          body: `Tim Anda telah ditugaskan untuk menangani PO/Pembelian On Location Project ${result.poNumber}`,
          data: {
            type: "po_assignment",
            poId: result.id,
            poNumber: result.poNumber,
            action: `/admin-area/logistic/purchasing/${result.id}`,
            timestamp: new Date().toISOString(),
          },
        });

        // 2. Notify Admin & PIC
        const adminUsers = await prisma.user.findMany({
          where: {
            role: { in: ["admin", "pic"] },
            active: true,
          },
          select: { id: true, email: true },
        });

        console.log(`📢 Sending PO Share notification to ${adminUsers.length} admin/pic users`);

        for (const admin of adminUsers) {
          await NotificationService.sendToUser(admin.id, {
            title: "PO Dibagikan ke Tim 🤝",
            body: `PO ${result.poNumber} telah dibagikan ke tim pelaksana.`,
            data: {
              type: "po_share",
              poId: result.id,
              poNumber: result.poNumber,
              teamId: req.body.teamId,
              action: `/admin-area/logistic/purchasing/${result.id}`,
              timestamp: new Date().toISOString(),
            },
          });
        }

      } catch (notifyError) {
        console.error("❌ Error sending PO notification:", notifyError);
      }
    }

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
        PurchaseRequest: {
          include: {
            requestedBy: {
              select: {
                id: true,
                namaLengkap: true,
                email: true
              }
            },
            karyawan: {
              select: {
                id: true,
                namaLengkap: true
              }
            }
          }
        },
        SPK: true,
        lines: {
          include: {
            product: true,
            receiptItems: {
              include: {
                receipt: {
                  include: {
                    execution: {
                      select: {
                        id: true,
                        executionDate: true,
                        status: true,
                        executor: {
                          select: {
                            id: true,
                            namaLengkap: true
                          }
                        }
                      }
                    }
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        },
        goodsReceipts: true,
        team: {
          include: {
            karyawan: {
              include: {
                karyawan: {
                  select: {
                    id: true,
                    namaLengkap: true,
                    jabatan: true
                  }
                }
              }
            }
          }
        },
        PurchaseExecution: {
          include: {
            executor: {
              select: {
                id: true,
                namaLengkap: true // Assuming linked via Karyawan
              }
            },
            receipts: {
              include: {
                items: true,
                photos: true
              }
            }
          },
          orderBy: {
             createdAt: 'desc'
          }
        }
      }
    });

    if (!data) {
      return res.status(404).json({ success: false, error: "PO tidak ditemukan" });
    }

    // Find related MRs via PR Details (Manual Relation)
    const prDetailIds = data.lines.map(l => l.prDetailId).filter(Boolean);
    let relatedMRs = [];
    if (prDetailIds.length > 0) {
       relatedMRs = await prisma.materialRequisition.findMany({
          where: {
             items: {
                some: {
                   purchaseRequestDetailId: { in: prDetailIds }
                }
             }
          },
          select: { id: true, mrNumber: true, status: true }
       });
    }

    return res.status(200).json({ success: true, data: { ...data, relatedMRs } });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: "Gagal mengambil detail PO", 
      details: error.message 
    });
  }
};

export const updatePOStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Misal: APPROVED, CANCELLED, CLOSED

  try {
    // Validasi sederhana: Jika membatalkan PO, pastikan belum ada penerimaan barang
    if (status === 'CANCELLED') {
      const hasReceipts = await prisma.goodsReceipt.findFirst({
        where: { poId: id }
      });
      if (hasReceipts && hasReceipts.status !== 'CANCELLED') {
        return res.status(400).json({ 
          success: false, 
          error: "PO tidak bisa dibatalkan karena sudah ada penerimaan barang." 
        });
      }
    }

    // Update PO status dan jumlahDipesan jika APPROVED/SENT
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get Old Status first to determine if we need to update stock
      const oldPO = await tx.purchaseOrder.findUnique({ 
        where: { id },
        select: { status: true } 
      });

      if (!oldPO) throw new Error("PO tidak ditemukan");

      // 2. Update PO status
      const updatedPO = await tx.purchaseOrder.update({
        where: { id },
        data: { 
          status,
          ...(status === 'REQUEST_REVISION' ? { requestRevisi: { increment: 1 } } : {})
        },
        include: {
          lines: {
            include: {
              prDetail: true,
              product: true // ✅ Include product to get conversionToStorage
            }
          }
        }
      });

      // 3. Logic Update Stock Balance (onPR)
      // Jalankan jika status APPROVED
      // ATAU status SENT tapi sebelumnya bukan APPROVED (loncat flow dari Draft/Revision)
      const shouldUpdateStock = 
          status === 'APPROVED' || 
          (status === 'SENT' && ['DRAFT', 'REVISION_NEEDED', 'PENDING_APPROVAL'].includes(oldPO.status));

      if (shouldUpdateStock) {
        // Get current period (start of month)
        const currentPeriod = new Date();
        currentPeriod.setDate(1);
        currentPeriod.setHours(0, 0, 0, 0);

        // ✅ HANDLE REVISION: If this is a revised PO (requestRevisi > 0)
        // We need to reverse the previous StockBalance updates before applying new ones
        if (updatedPO.requestRevisi && updatedPO.requestRevisi > 0) {
          console.log(`🔄 Handling PO Revision (requestRevisi=${updatedPO.requestRevisi})`);
          
          const previousLines = await tx.purchaseOrderLine.findMany({
            where: { 
              poId: id,
              notGr: { not: true } // Only physical goods
            },
            include: {
              product: true // ✅ Include product for conversion
            }
          });

          console.log(`📦 Reversing StockBalance for ${previousLines.length} previous PO lines`);

          // Reverse previous StockBalance updates
          for (const prevLine of previousLines) {
            if (prevLine.notGr === true) continue; // Skip service items

            // ✅ Reverse Calculation with Conversion
            const conversion = parseFloat(prevLine.product?.conversionToStorage) || 1;
            const qtyToReverse = Number(prevLine.quantity) * conversion;

            const stockBalance = await tx.stockBalance.findFirst({
              where: {
                productId: prevLine.productId,
                warehouseId: updatedPO.warehouseId,
                period: currentPeriod
              }
            });

            if (stockBalance) {
              // Reverse the previous onPR increment
              // Check to ensuring onPR doesn't go below 0
              const currentOnPR = Number(stockBalance.onPR);
              const newOnPR = Math.max(0, currentOnPR - qtyToReverse);

              await tx.stockBalance.update({
                where: { id: stockBalance.id },
                data: {
                  onPR: newOnPR
                }
              });
              console.log(`  ↩️  Reversed onPR for ${prevLine.productId}: -${qtyToReverse} (${prevLine.quantity} x ${conversion})`);
            }
          }
        }

        // ✅ APPLY NEW STOCKBALANCE
        for (const line of updatedPO.lines) {
          if (line.prDetailId) {
            // Recalculate Total Ordered Qty for this PR Detail
            const totalOrdered = await tx.purchaseOrderLine.aggregate({
              where: {
                prDetailId: line.prDetailId,
                purchaseOrder: {
                  status: { in: ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED'] }
                }
              },
              _sum: {
                quantity: true
              }
            });

            // Update PR Detail with the accurate total
            await tx.purchaseRequestDetail.update({
              where: { id: line.prDetailId },
              data: {
                jumlahDipesan: totalOrdered._sum.quantity || 0
              }
            });
          }

          // ✅ Skip StockBalance update for service items (notGr=true)
          if (line.notGr === true) {
             continue;
          }

          // ✅ Calculate Qty with Conversion
          const conversion = parseFloat(line.product?.conversionToStorage) || 1;
          const qtyToAdd = Number(line.quantity) * conversion;

          // Update StockBalance.onPR
          const stockBalance = await tx.stockBalance.findFirst({
            where: {
              productId: line.productId,
              warehouseId: updatedPO.warehouseId,
              period: currentPeriod
            }
          });

          if (stockBalance) {
            await tx.stockBalance.update({
              where: { id: stockBalance.id },
              data: {
                onPR: {
                  increment: qtyToAdd // Apply converted quantity
                }
              }
            });
            console.log(`  ✅ Applied onPR for ${line.productId}: +${qtyToAdd} (${line.quantity} x ${conversion})`);
          } else {
            // Create StockBalance if not exists for current period
            await tx.stockBalance.create({
              data: {
                productId: line.productId,
                warehouseId: updatedPO.warehouseId,
                period: currentPeriod,
                onPR: qtyToAdd, // Apply converted quantity
                stockAwal: 0,
                stockIn: 0,
                stockOut: 0,
                stockAkhir: 0,
                bookedStock: 0,
                availableStock: 0
              }
            });
            console.log(`  ✅ Created StockBalance for ${line.productId}: onPR=${qtyToAdd}`);
          }
        }
      }

      return updatedPO;
    });

    return res.status(200).json({ 
      success: true, 
      data: result, 
      message: `Status PO berhasil diubah menjadi ${status}` 
    });
  } catch (error) {
    console.error("Error updating PO status:", error);
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

/**
 * @desc Get POs for Execution (User Team Based)
 */
export const getPOForExecution = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get Karyawan ID & Teams
    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
      include: { teamKaryawan: true }
    });

    if (!karyawan) {
      return res.status(403).json({ success: false, error: "Data karyawan tidak ditemukan" });
    }

    const teamIds = karyawan.teamKaryawan.map(tk => tk.teamId);

    if (teamIds.length === 0) {
       return res.status(200).json({ success: true, data: [] });
    }

    // 2. Fetch POs assigned to these teams
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        teamId: { in: teamIds },
        // Only show relevant status for execution ? 
        // existing code implies assignment happens, so let's show all assigned to team
      },
      include: {
         supplier: true,
         project: true,
         warehouse: true,
         lines: { include: { product: true } },
         team: true,
         PurchaseExecution: true,
         PurchaseRequest: {
            select: {
               nomorPr: true,
               requestedBy: {
                   select: { id: true, userId: true, namaLengkap: true }
               },
               karyawan: {
                   select: { id: true, userId: true, namaLengkap: true }
               }
            }
         }
      },
      orderBy: { createdAt: 'desc' }
    });

    // DEBUG: Check if PurchaseRequest data is present
    if (pos.length > 0) {
        console.log('DEBUG First PO PR Data:', JSON.stringify(pos[0].PurchaseRequest, null, 2));
    }

    return res.status(200).json({ success: true, data: pos });

  } catch (error) {
    console.error("Error fetching execution POs:", error);
    return res.status(500).json({ success: false, error: "Gagal mengambil data PO", details: error.message });
  }
};


/**
 * @desc Send PO Email to Supplier
 */
export const sendPOEmail = async (req, res) => {
  const { id } = req.params;
  const { email, poNumber } = req.body;
  const file = req.file;

  try {
    let Resend;
    try {
      // Dynamic import to avoid crash if resend is not installed
      // Note: 'resend' package exports 'Resend' class
      const module = await import('resend');
      Resend = module.Resend;
    } catch (e) {
      return res.status(500).json({ 
        success: false, 
        error: "Module 'resend' belum terinstall. Jalankan 'npm install resend' di backend." 
      });
    }

    if (!file) return res.status(400).json({ success: false, error: "File PDF wajib disertakan" });

    // Validate Resend API Key
    if (!process.env.RESEND_API_KEY) {
       return res.status(500).json({ 
         success: false, 
         error: "API Key Resend belum diatur. Tambahkan RESEND_API_KEY di .env backend." 
       });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(poNumber || id);

    // Send Email using Resend
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'Purchasing System <onboarding@resend.dev>';
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [email],
      subject: `Purchase Order - ${poNumber || id}`,
      html: `
        <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
          <h2>Purchase Order: ${poNumber || id}</h2>
          <p>Yth. Supplier,</p>
          <p>Mohon segera diproses pesanan kami. Berikut adalah dokumen Purchase Order (terlampir) dan QR Code untuk akses cepat saat pengiriman barang ke gudang kami:</p>
          <div style="text-align: center; margin: 20px 0;">
            <img src="${qrCodeDataUrl}" alt="QR Code PO" style="width: 180px;" />
          </div>
          <p>Simpan QR Code ini untuk ditunjukkan kepada petugas gudang.</p>
          <p>Terima kasih.</p>
        </div>
      `,
      attachments: [
        {
          filename: file.originalname,
          content: file.buffer,
        },
      ],
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(400).json({ 
        success: false, 
        error: "Gagal mengirim email via Resend", 
        details: error.message || JSON.stringify(error) 
      });
    }

    return res.json({ success: true, message: "Email berhasil dikirim ke supplier via Resend", data });
  } catch (error) {
    console.error("Email Error:", error);
    return res.status(500).json({ success: false, error: "Terjadi kesalahan internal", details: error.message });
  }
};

/**
 * @desc Submit Purchase Execution Report
 * @route POST /api/po/:poId/execution
 * @access Private
 */
export const submitPurchaseExecution = async (req, res) => {
  try {
    const { poId } = req.params;
    const { poLineId, receiptsData, notes } = req.body;
    const userId = req.user?.id;

    // Validate required fields
    if (!poLineId) {
      return res.status(400).json({
        success: false,
        error: 'PO Line ID is required'
      });
    }

    if (!receiptsData || receiptsData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one receipt is required'
      });
    }

    // Parse receiptsData if it's a string
    const receipts = typeof receiptsData === 'string' ? JSON.parse(receiptsData) : receiptsData;

    // Get uploaded files
    const receiptPhotos = req.files?.receiptPhotos || [];
    const materialPhotos = req.files?.materialPhotos || [];

    // Get Karyawan ID from authenticated user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { karyawan: true }
    });

    if (!user?.karyawan) {
      return res.status(400).json({
        success: false,
        error: 'User tidak terhubung dengan data karyawan'
      });
    }

    const executorId = user.karyawan.id;

    // Verify PO exists
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        lines: {
          include: {
            product: true
          }
        }
      }
    });

    if (!po) {
      return res.status(404).json({
        success: false,
        error: 'Purchase Order not found'
      });
    }

    // Verify PO Line exists
    const poLine = po.lines.find(line => line.id === poLineId);
    if (!poLine) {
      return res.status(404).json({
        success: false,
        error: 'PO Line not found'
      });
    }

    // Create uploads directory if it doesn't exist
    const fs = await import('fs');
    const path = await import('path');
    const uploadDir = './public/uploads/receipts';
    fs.mkdirSync(uploadDir, { recursive: true });

    // Helper function to save file
    const saveFile = async (file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `${uniqueSuffix}${ext}`;
      const filepath = path.join(uploadDir, filename);
      
      await fs.promises.writeFile(filepath, file.buffer);
      return `/uploads/receipts/${filename}`;
    };

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or find PurchaseExecution
      let execution = await tx.purchaseExecution.findFirst({
        where: {
          poId: poId,
          status: 'IN_PROGRESS'
        }
      });

      if (!execution) {
        execution = await tx.purchaseExecution.create({
          data: {
            poId: poId,
            executorId: executorId,
            status: 'IN_PROGRESS',
            totalSpent: 0,
            notes: notes || null
          }
        });
      }

      let totalSpent = 0;

      // Track created receipts/items for material photo linking
      const createdReceipts = [];

      // 2. Process each receipt
      for (let i = 0; i < receipts.length; i++) {
        const receiptData = receipts[i];
        
        // Create PurchaseReceipt
        const receipt = await tx.purchaseReceipt.create({
          data: {
            executionId: execution.id,
            receiptNumber: receiptData.receiptNumber || null,
            storeName: receiptData.storeName || null,
            receiptDate: new Date(receiptData.receiptDate),
            totalAmount: parseFloat(receiptData.totalAmount),
            paymentMethod: receiptData.paymentMethod || 'CASH'
          }
        });

        // Save receipt photo if exists
        // Note: receiptPhotos[i] matches receipts[i] by index as per previous frontend logic
        if (receiptPhotos[i]) {
          const photoUrl = await saveFile(receiptPhotos[i]);
          await tx.receiptPhoto.create({
            data: {
              receiptId: receipt.id,
              photoUrl: photoUrl,
              photoType: 'BON'
            }
          });
        }

        // Create ReceiptItem linking to PO Line
        const receiptItem = await tx.receiptItem.create({
          data: {
            receiptId: receipt.id,
            poLineId: poLineId,
            isAdditional: false,
            productName: poLine.product.name,
            quantity: poLine.quantity,
            unit: poLine.product.purchaseUnit,
            unitPrice: parseFloat(receiptData.totalAmount) / poLine.quantity,
            totalPrice: parseFloat(receiptData.totalAmount),
            storeName: receiptData.storeName || null
          }
        });
        
        createdReceipts.push({ receipt, receiptItem });
      }

      // 3. Save material photos
      // material_photo_map should be an array of indices corresponding to receipts array
      // e.g. ["0", "0", "1"] means photo 0->receipt 0, photo 1->receipt 0, photo 2->receipt 1
      const materialPhotoMap = req.body.material_photo_map;
      
      for (let i = 0; i < materialPhotos.length; i++) {
        const photoUrl = await saveFile(materialPhotos[i]);
        
        // Default to first receipt if no map provided (backward compatibility)
        let targetIndex = 0;
        
        if (materialPhotoMap && materialPhotoMap[i] !== undefined) {
             targetIndex = parseInt(materialPhotoMap[i]);
        }
        
        const target = createdReceipts[targetIndex];
        
        if (target) {
          await tx.receiptPhoto.create({
            data: {
              receiptId: target.receipt.id,
              receiptItemId: target.receiptItem.id, // Link to specific item
              photoUrl: photoUrl,
              photoType: 'PRODUCT'
            }
          });
        }
      }

      // 4. Update execution totalSpent
      await tx.purchaseExecution.update({
        where: { id: execution.id },
        data: { totalSpent: totalSpent }
      });

      return execution;
    });

    return res.status(201).json({
      success: true,
      message: 'Purchase execution report submitted successfully',
      data: result
    });

  } catch (error) {
    console.error('Error submitting purchase execution:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit purchase execution report',
      details: error.message
    });
  }
};

/**
 * @desc Get PO Execution Detail for a specific PO Line
 * @route GET /api/po/execution/:poLineId
 */
export const getPOExecutionDetail = async (req, res) => {
  try {
    const { poLineId } = req.params;

    // Find the PO Line with all related execution data
    const poLine = await prisma.purchaseOrderLine.findUnique({
      where: { id: poLineId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            purchaseUnit: true
          }
        },
        receiptItems: {
          include: {
            receipt: {
              include: {
                execution: {
                  include: {
                    executor: {
                      select: {
                        id: true,
                        namaLengkap: true
                      }
                    },
                    receipts: {
                      include: {
                        photos: {
                          where: {
                            photoType: 'BON'
                          },
                          select: {
                            photoUrl: true
                          },
                          take: 1
                        }
                      }
                    }
                  }
                },
                photos: {
                  select: {
                    photoUrl: true,
                    photoType: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
          // take: 1 removed to fetch ALL items
        }
      }
    });

    if (!poLine) {
      return res.status(404).json({
        success: false,
        error: 'PO Line not found'
      });
    }

    // Check if execution exists (check first item)
    const firstReceiptItem = poLine.receiptItems?.[0];
    if (!firstReceiptItem || !firstReceiptItem.receipt?.execution) {
      return res.status(404).json({
        success: false,
        error: 'No execution report found for this item'
      });
    }

    const execution = firstReceiptItem.receipt.execution;

    // Get material photos ONLY for this specific receipt/item
    // Since we now store photos linked to specific receipts, we filter by receiptId
    // We need to fetch photos for ALL receipts associated with this item
    const receiptIds = poLine.receiptItems.map(item => item.receipt.id);
    
    // Optional: If we want to show ALL material photos for this ITEM (across all its receipts)
    // The current UI might expect them per-receipt or global.
    // ViewPurchaseReport.tsx shows `execution.receipts` which has `receiptPhotoUrl` (BON).
    // It also shows `execution.materialPhotos`. 
    // Let's assume global material photos for the item report is fine for now, 
    // OR we can distribute them if the UI supported it (it doesn't seem to support per-receipt material display clearly in View report yet, 
    // it just shows a gallery. Let's check ViewPurchaseReport again. 
    // Line 79: const materialPhotos = execution?.materialPhotos || [];
    // So it expects a flat list of material photos in the execution object.
    
    const materialPhotos = await prisma.receiptPhoto.findMany({
      where: {
        receiptId: { in: receiptIds }, // Fetch photos for ALL receipts of this item
        photoType: 'PRODUCT'
      },
      select: {
        photoUrl: true
      }
    });

    // Format the response data
    const responseData = {
      id: poLine.id, // Ensure this is PO Line ID, not ReceiptItem ID
      receiptItemId: firstReceiptItem.id, // Keep reference just in case
      productName: poLine.product.name,
      quantity: poLine.quantity,
      unitPrice: poLine.unitPrice,
      totalPrice: poLine.totalAmount,
      unit: poLine.product.purchaseUnit,
      product: poLine.product,
      receipt: {
        id: firstReceiptItem.receipt.id, // Primary receipt info (fallback)
        receiptNumber: firstReceiptItem.receipt.receiptNumber,
        storeName: firstReceiptItem.receipt.storeName,
        receiptDate: firstReceiptItem.receipt.receiptDate,
        totalAmount: firstReceiptItem.receipt.totalAmount,
        paymentMethod: firstReceiptItem.receipt.paymentMethod,
        receiptPhotoUrl: firstReceiptItem.receipt.photos?.find(p => p.photoType === 'BON')?.photoUrl,
        execution: {
          id: execution.id,
          executionDate: execution.executionDate,
          status: execution.status,
          notes: execution.notes,
          executor: execution.executor,
          // Map ALL receipt items to the receipts array
          receipts: poLine.receiptItems.map(item => ({
             id: item.receipt.id,
             receiptNumber: item.receipt.receiptNumber,
             storeName: item.receipt.storeName,
             receiptDate: item.receipt.receiptDate,
             totalAmount: item.receipt.totalAmount,
             paymentMethod: item.receipt.paymentMethod,
             receiptPhotoUrl: item.receipt.photos?.find(p => p.photoType === 'BON')?.photoUrl
          })),
          // helper to flatten material photos
          materialPhotos: materialPhotos.map(p => p.photoUrl)
        }
      }
    };

    return res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching PO execution detail:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch execution detail',
      details: error.message
    });
  }
};

/**
 * @desc Delete Purchase Execution Report
 * @route DELETE /api/po/execution/:executionId
 */
export const deletePurchaseExecution = async (req, res) => {
  try {
    const { executionId } = req.params;

    const execution = await prisma.purchaseExecution.findUnique({
      where: { id: executionId }
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution report not found'
      });
    }

    // Delete execution (Cascade will delete receipts and photos, but we need to delete files first)
    
    // Import for file deletion
    const fs = await import('fs');
    const path = await import('path');
    
    // Helper function to delete file (duplicated for safety in this scope)
    const deleteFile = async (fileUrl) => {
        if (!fileUrl) return;
        try {
            const filePath = path.join('./public', fileUrl);
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        } catch (err) {
            console.error('Error deleting file:', fileUrl, err);
        }
    };

    // Fetch all photos in this execution
    const photosToDelete = await prisma.receiptPhoto.findMany({
        where: {
            receipt: {
                executionId: executionId
            }
        }
    });

    // Delete files
    for (const photo of photosToDelete) {
        await deleteFile(photo.photoUrl);
    }

    await prisma.purchaseExecution.delete({
      where: { id: executionId }
    });

    return res.status(200).json({
      success: true,
      message: 'Execution report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting purchase execution:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete execution report'
    });
  }
};

/**
 * @desc Update Purchase Execution Report
 * @route PUT /api/po/execution/:executionId
 */
export const updatePurchaseExecution = async (req, res) => {
  try {
    const { executionId } = req.params;
    
    // Parse form data
    // existingReceipts: JSON string of array [{id, totalAmount, ...}]
    // reportNotes: string
    // deletedPhotoIds: JSON string of array [id1, id2]
    // material_photo_map: array of indices for NEW photos
    
    // Note: Since this is multipart/form-data, non-file fields are strings
    const receiptsData = req.body.receipts ? JSON.parse(req.body.receipts) : [];
    const reportNotes = req.body.notes || '';
    const deletedPhotoIds = req.body.deletedPhotoIds ? JSON.parse(req.body.deletedPhotoIds) : [];
    const materialPhotoMap = req.body.material_photo_map; // Array or single value
    const receiptPhotoMap = req.body.receipt_photo_map;
    const poLineId = req.body.poLineId;
    
    // Files
    const files = req.files;
    const newReceiptPhotos = files['newReceiptPhotos'] || [];
    const newMaterialPhotos = files['newMaterialPhotos'] || [];

    // Create uploads directory if it doesn't exist
    const fs = await import('fs');
    const path = await import('path');
    const uploadDir = './public/uploads/receipts';
    fs.mkdirSync(uploadDir, { recursive: true });

    // Helper function to save file
    const saveFile = async (file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `${uniqueSuffix}${ext}`;
      const filepath = path.join(uploadDir, filename);
      
      await fs.promises.writeFile(filepath, file.buffer);
      return `/uploads/receipts/${filename}`;
    };

    // Helper function to delete file
    const deleteFile = async (fileUrl) => {
        if (!fileUrl) return;
        try {
            const filePath = path.join('./public', fileUrl);
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        } catch (err) {
            console.error('Error deleting file:', fileUrl, err);
        }
    };

    // Fetch PO Line Product Details if creating new items
    let poLineDetails = null;
    if (poLineId) {
        poLineDetails = await prisma.purchaseOrderLine.findUnique({
            where: { id: poLineId },
            include: { product: true }
        });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Execution
      const execution = await tx.purchaseExecution.update({
        where: { id: executionId },
        data: {
          notes: reportNotes
        }
      });

      // 2. Handle Deleted Photos
      if (deletedPhotoIds.length > 0) {
        // Fetch photos to get URLs for deletion
        const photosToDelete = await tx.receiptPhoto.findMany({
            where: { id: { in: deletedPhotoIds } }
        });

        for (const photo of photosToDelete) {
            await deleteFile(photo.photoUrl);
        }

        await tx.receiptPhoto.deleteMany({
          where: { id: { in: deletedPhotoIds } }
        });
      }

      // 3. Process Receipts (Update or Create)
      let totalSpent = 0;
      const processedReceipts = []; // Keep track to handle deletions if needed (optional, or just trust the list)

      // Get existing receipts IDs scoped to the current PO Line to identify deletions
      // We only want to delete receipts that belong to THIS item/line, not others sharing the execution.
      let currentReceiptIds = [];
      
      if (poLineId) {
          const currentReceipts = await tx.purchaseReceipt.findMany({
            where: { 
                executionId,
                items: {
                    some: {
                        poLineId: poLineId
                    }
                }
            },
            select: { id: true }
          });
          currentReceiptIds = currentReceipts.map(r => r.id);
          
          const incomingReceiptIds = receiptsData.filter(r => r.id).map(r => r.id);
          
          // Delete receipts that are missing from the incoming list (BUT OBVIOUSLY only those that belong to this line)
          const receiptsToDelete = currentReceiptIds.filter(id => !incomingReceiptIds.includes(id));
          
          if (receiptsToDelete.length > 0) {
            // Fetch photos associated with these receipts to delete files
            const receiptPhotosToDelete = await tx.receiptPhoto.findMany({
                where: { receiptId: { in: receiptsToDelete } }
            });

            for (const photo of receiptPhotosToDelete) {
                await deleteFile(photo.photoUrl);
            }

            await tx.purchaseReceipt.deleteMany({
              where: { id: { in: receiptsToDelete } }
            });
          }
      } 
      // Else: If no poLineId provided, we skip implicit deletion to avoid wiping other items' data unintentionally.
      // (Or we could fetch ALL receipts if we were sure this was a full-execution edit, but based on user feedback, it's per-item).

      // Upsert Receipts
      for (const [index, rData] of receiptsData.entries()) {
        let receipt;
        
        const receiptPayload = {
          receiptNumber: rData.receiptNumber || '',
          receiptDate: new Date(rData.receiptDate),
          totalAmount: parseFloat(rData.totalAmount),
          paymentMethod: rData.paymentMethod || 'CASH',
          storeName: rData.storeName || ''
        };

        totalSpent += receiptPayload.totalAmount;

        if (rData.id && currentReceiptIds.includes(rData.id)) {
           // Update existing
           receipt = await tx.purchaseReceipt.update({
             where: { id: rData.id },
             data: receiptPayload
           });
           
           // Also update the linked ReceiptItem(s) to ensure totals match
           // Currently assuming 1 item per receipt in this simplified flow
           await tx.receiptItem.updateMany({
             where: { receiptId: rData.id },
             data: {
               totalPrice: receiptPayload.totalAmount,
               storeName: receiptPayload.storeName
             }
           });
           
        } else {
           // Create new
           
           // Ensure we have valid PO line details before trying to link
           const validPoLineId = poLineDetails ? poLineDetails.id : null;
           
           // If we don't have a valid PO Line context, we create a generic item (no link)
           // But we populate name/unit if available from context or fallback
           const productName = poLineDetails ? poLineDetails.product.name : 'Item';
           const unit = poLineDetails ? poLineDetails.product.purchaseUnit : 'unit';
           const quantity = poLineDetails ? poLineDetails.quantity : 0;
           
           // Unit Price calc based on totalAmount allocation?
           // Usually 1 Receipt = 1 Item for this simplified flow
           const unitPrice = quantity > 0 ? (receiptPayload.totalAmount / parseFloat(quantity)) : 0;

           receipt = await tx.purchaseReceipt.create({
             data: {
               ...receiptPayload,
               executionId: execution.id,
               items: {
                  create: [{
                    poLineId: validPoLineId, // Only link if verified existing
                    productName: productName,
                    quantity: quantity,
                    unit: unit,
                    unitPrice: unitPrice,
                    totalPrice: receiptPayload.totalAmount,
                    storeName: receiptPayload.storeName
                  }]
               }
             }
           });
        }
        
        // Link specific receipt item (since we have 1 item per receipt logic mostly)
        // Find existing or created item
        const receiptItem = await tx.receiptItem.findFirst({
            where: { receiptId: receipt.id }
        });

        processedReceipts.push({ receipt, receiptItem, index }); 
        // Index here corresponds to the order in `receiptsData` array from frontend
      }

      // 4. Handle NEW Material Photos
      // material_photo_map maps the index of `newMaterialPhotos` array to the `receiptsData` array index
      if (newMaterialPhotos.length > 0) {
          for (let i = 0; i < newMaterialPhotos.length; i++) {
             const photoUrl = await saveFile(newMaterialPhotos[i]);
             
             let targetReceiptIndex = 0;
             if (materialPhotoMap && materialPhotoMap[i] !== undefined) {
                 targetReceiptIndex = parseInt(materialPhotoMap[i]);
             }
             
             // Find the receipt corresponding to this index
             const target = processedReceipts.find(p => p.index === targetReceiptIndex);
             
             if (target) {
                 await tx.receiptPhoto.create({
                     data: {
                         receiptId: target.receipt.id,
                         receiptItemId: target.receiptItem?.id,
                         photoUrl: photoUrl,
                         photoType: 'PRODUCT'
                     }
                 });
             }
          }
      }

      // 5. Handle NEW Receipt Photos (Bon)
      if (newReceiptPhotos.length > 0) {
          for (let i = 0; i < newReceiptPhotos.length; i++) {
             const photoUrl = await saveFile(newReceiptPhotos[i]);
             
             let targetReceiptIndex = 0;
             if (receiptPhotoMap) {
                if (Array.isArray(receiptPhotoMap)) {
                    targetReceiptIndex = parseInt(receiptPhotoMap[i]);
                } else {
                    targetReceiptIndex = parseInt(receiptPhotoMap);
                }
             }

             // Find the receipt corresponding to this index
             const target = processedReceipts.find(p => p.index === targetReceiptIndex);
             
             if (target) {
                 await tx.receiptPhoto.create({
                     data: {
                         receiptId: target.receipt.id,
                         photoUrl: photoUrl,
                         photoType: 'BON'
                     }
                 });
             }
          }
      }

      // Update Total Spent
      await tx.purchaseExecution.update({
        where: { id: executionId },
        data: { totalSpent }
      });
      
      return execution;
    });

    return res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error updating execution:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update report'
    });
  }
};

/**
 * @desc Toggle checkPurchaseExecution for a PO Line
 * @route PATCH /api/po/line/:poLineId/verify
 * @access Private
 */
export const togglePOLineVerification = async (req, res) => {
  try {
    const { poLineId } = req.params;
    const { checked } = req.body;

    if (typeof checked !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'checked field must be a boolean'
      });
    }

    // Update the PO Line
    const updatedLine = await prisma.purchaseOrderLine.update({
      where: { id: poLineId },
      data: { checkPurchaseExecution: checked }
    });

    return res.status(200).json({
      success: true,
      message: `PO Line ${checked ? 'verified' : 'unverified'} successfully`,
      data: updatedLine
    });

  } catch (error) {
    console.error('Error toggling PO line verification:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update verification status',
      details: error.message
    });
  }
};
/**
 * @desc Update PO Line Actual Data (qtyActual, unitPriceActual)
 * @route PATCH /api/po/line/:poLineId/update-actual
 * @access Private
 */
export const updatePOLineActualData = async (req, res) => {
  try {
    const { poLineId } = req.params;
    const { qtyActual, unitPriceActual } = req.body;

    // Validate input
    if (qtyActual === undefined && unitPriceActual === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one of qtyActual or unitPriceActual must be provided'
      });
    }

    // Get current PO Line data with PO relation
    const poLine = await prisma.purchaseOrderLine.findUnique({
      where: { id: poLineId },
      include: {
        purchaseOrder: {
          include: {
            PurchaseExecution: {
              where: {
                status: {
                  in: ['IN_PROGRESS', 'COMPLETED']
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    if (!poLine) {
      return res.status(404).json({
        success: false,
        error: 'PO Line not found'
      });
    }

    // Calculate checkMatch
    const newQtyActual = qtyActual !== undefined ? Number(qtyActual) : Number(poLine.qtyActual);
    const newUnitPriceActual = unitPriceActual !== undefined ? Number(unitPriceActual) : Number(poLine.unitPriceActual);
    const poQty = Number(poLine.quantity);
    const poUnitPrice = Number(poLine.unitPrice);

    // Check if both qty and price match (with small tolerance for decimal precision)
    const qtyMatch = newQtyActual > 0 && Math.abs(poQty - newQtyActual) < 0.01;
    const priceMatch = newUnitPriceActual > 0 && Math.abs(poUnitPrice - newUnitPriceActual) < 0.01;
    const checkMatch = qtyMatch && priceMatch;

    // Prepare update data for PO Line
    const updateData = {
      checkMatch,
      checkPurchaseExecution: true // Set to true when saving actual data
    };

    if (qtyActual !== undefined) {
      updateData.qtyActual = Number(qtyActual);
    }

    if (unitPriceActual !== undefined) {
      updateData.unitPriceActual = Number(unitPriceActual);
    }

    // Use transaction to update both PO Line, PurchaseExecution, StaffBalance, and StaffLedger
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate Grand Total BEFORE update (old value)
      // Must be done BEFORE updating the current line
      const allPoLinesBeforeUpdate = await tx.purchaseOrderLine.findMany({
        where: { poId: poLine.poId }
      });

      const grandTotalBefore = allPoLinesBeforeUpdate.reduce((sum, line) => {
        const qty = Number(line.qtyActual) || 0;
        const price = Number(line.unitPriceActual) || 0;
        return sum + (qty * price);
      }, 0);

      // 2. Update the PO Line
      const updatedLine = await tx.purchaseOrderLine.update({
        where: { id: poLineId },
        data: updateData
      });

      // 3. Update PurchaseExecution status to COMPLETED if exists
      const purchaseExecution = poLine.purchaseOrder.PurchaseExecution?.[0];
      if (purchaseExecution) {
        await tx.purchaseExecution.update({
          where: { id: purchaseExecution.id },
          data: { status: 'COMPLETED' }
        });



        // Calculate Grand Total AFTER update (new value)
        // We need to simulate the update for the current line
        const grandTotalAfter = allPoLinesBeforeUpdate.reduce((sum, line) => {
          if (line.id === poLineId) {
            // Use the new values for the line being updated
            const qty = qtyActual !== undefined ? Number(qtyActual) : Number(line.qtyActual) || 0;
            const price = unitPriceActual !== undefined ? Number(unitPriceActual) : Number(line.unitPriceActual) || 0;
            return sum + (qty * price);
          } else {
            // Use existing values for other lines
            const qty = Number(line.qtyActual) || 0;
            const price = Number(line.unitPriceActual) || 0;
            return sum + (qty * price);
          }
        }, 0);

        // Calculate the delta (difference)
        const delta = grandTotalAfter - grandTotalBefore;

        // Check if StaffLedger entry already exists for this PO
        const existingLedgerEntry = await tx.staffLedger.findFirst({
          where: {
            refId: poLine.purchaseOrder.id,
            category: 'OPERASIONAL_PROYEK',
            type: 'EXPENSE_REPORT'
          },
          orderBy: {
            tanggal: 'desc'
          }
        });

        const isFirstSave = !existingLedgerEntry;

        // Update StaffBalance and StaffLedger if:
        // 1. First save (isFirstSave = true) OR
        // 2. There's a change (delta !== 0)
        
        // DISABLED: Logic ini sudah dipindahkan ke Supplier Invoice
        /*
        if ((isFirstSave || delta !== 0) && grandTotalAfter > 0) {
          const executorId = purchaseExecution.executorId;
          
          // DETERMINE AMOUNT TO UPDATE
          // If first save: use FULL current amount (catch up)
          // If edit: use DELTA (difference)
          const amountChange = isFirstSave ? grandTotalAfter : delta;


          // 1. Update or Create StaffBalance (OPERASIONAL_PROYEK)
          const existingBalance = await tx.staffBalance.findUnique({
            where: {
              karyawanId_category: {
                karyawanId: executorId,
                category: 'OPERASIONAL_PROYEK'
              }
            }
          });
          
          console.log('Existing Balance:', existingBalance);

          // IMPORTANT: Get saldoAwal BEFORE updating StaffBalance to prevent race condition
          const saldoSebelumUpdate = Number(existingBalance?.amount || 0);
          console.log('💰 Saldo sebelum update:', saldoSebelumUpdate);

          if (existingBalance) {
            // Update existing balance with amountChange
            console.log('📝 Updating existing StaffBalance with amountChange:', amountChange);
            await tx.staffBalance.update({
              where: {
                karyawanId_category: {
                  karyawanId: executorId,
                  category: 'OPERASIONAL_PROYEK'
                }
              },
              data: {
                totalOut: {
                  increment: amountChange 
                },
                amount: {
                  decrement: amountChange // Saldo berkurang
                }
              }
            });
            console.log('✅ StaffBalance updated successfully');
          } else {
            // Create new balance if doesn't exist
            console.log('➕ Creating new StaffBalance with grandTotal:', grandTotalAfter);
            await tx.staffBalance.create({
              data: {
                karyawanId: executorId,
                category: 'OPERASIONAL_PROYEK',
                totalOut: grandTotalAfter,
                amount: -grandTotalAfter
              }
            });
            console.log('✅ StaffBalance created successfully');
          }

          // 3. Create StaffLedger entry (Accounting: Kredit = expense/keluar)
          // Use saldoSebelumUpdate (captured before StaffBalance update) to avoid race condition
          if (amountChange > 0) {
            console.log('📊 Creating StaffLedger entry (KREDIT) for amountChange:', amountChange);
            const saldoSesudah = saldoSebelumUpdate - amountChange; // KREDIT mengurangi saldo
            
            await tx.staffLedger.create({
              data: {
                karyawanId: executorId,
                tanggal: new Date(),
                keterangan: `Pembelian lapangan PO ${poLine.purchaseOrder.poNumber} - ${isFirstSave ? 'Baru' : 'Penambahan'}: Rp ${amountChange.toLocaleString('id-ID')} (Total: Rp ${grandTotalAfter.toLocaleString('id-ID')})`,
                saldoAwal: saldoSebelumUpdate, // Saldo sebelum transaksi (captured before update)
                debit: 0,
                kredit: amountChange, // Record expense
                saldo: saldoSesudah, // Saldo setelah transaksi
                category: 'OPERASIONAL_PROYEK',
                type: 'EXPENSE_REPORT',
                refId: poLine.purchaseOrder.id,
                createdBy: executorId
              }
            });
            console.log('✅ StaffLedger (KREDIT) created successfully');
          } else if (amountChange < 0) {
            // If amountChange is negative (correction/reduction)
            console.log('📊 Creating StaffLedger entry (DEBIT) for correction:', Math.abs(amountChange));
            const saldoSesudah = saldoSebelumUpdate + Math.abs(amountChange); // DEBIT menambah saldo
            
            await tx.staffLedger.create({
              data: {
                karyawanId: executorId,
                tanggal: new Date(),
                keterangan: `Koreksi pembelian lapangan PO ${poLine.purchaseOrder.poNumber} - Pengurangan: Rp ${Math.abs(amountChange).toLocaleString('id-ID')} (Total: Rp ${grandTotalAfter.toLocaleString('id-ID')})`,
                saldoAwal: saldoSebelumUpdate, // Saldo sebelum transaksi (captured before update)
                debit: Math.abs(amountChange), // Debit for correction
                kredit: 0,
                saldo: saldoSesudah, // Saldo setelah transaksi
                category: 'OPERASIONAL_PROYEK',
                type: 'EXPENSE_REPORT',
                refId: poLine.purchaseOrder.id,
                createdBy: executorId
              }
            });
            console.log('✅ StaffLedger (DEBIT) created successfully');
          }
        } else {
          console.log('⚠️ Skipping StaffBalance/Ledger update - Condition not met');
          console.log('   Reason: delta === 0 OR grandTotalAfter <= 0');
        }
        */
      }

      return updatedLine;
    });

    return res.status(200).json({
      success: true,
      message: 'Actual data updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error updating PO line actual data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update actual data',
      details: error.message
    });
  }
};

/**
 * Helper to generate internal Supplier Invoice Number
 */
const generateInvoiceNumberInternal = async (tx) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-SUPP/${year}/${month}/`;
    
    // Get all invoices from current month
    const startOfMonth = new Date(year, now.getMonth(), 1);
    const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);
    
    const allInvoices = await tx.supplierInvoice.findMany({
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
        select: { invoiceNumber: true }
    });

    const matchingInvoices = allInvoices.filter(inv => 
        inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)
    );

    let nextNumber = 1;
    if (matchingInvoices.length > 0) {
        const numbers = matchingInvoices
            .map(inv => {
                const match = inv.invoiceNumber.match(/INV-SUPP\/(\d{4})\/(\d{2})\/(\d{4})/);
                return match ? parseInt(match[3], 10) : 0;
            })
            .filter(num => num > 0);
        
        if (numbers.length > 0) {
            nextNumber = Math.max(...numbers) + 1;
        }
    } else if (allInvoices.length > 0) {
        nextNumber = allInvoices.length + 1;
    }

    return `INV-SUPP/${year}/${month}/${String(nextNumber).padStart(4, '0')}`;
};

/**
 * @desc Submit PO to Accounting (Create UNVERIFIED Supplier Invoice)
 */
export const submitPOToAccounting = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch PO with lines
            const po = await tx.purchaseOrder.findUnique({
                where: { id },
                include: { lines: true, supplier: true, warehouse: true }
            });

            if (!po) throw new Error("PO Not Found");

            // 2. Validate Status and Warehouse
            if (po.status !== 'FULLY_RECEIVED') {
                throw new Error("PO must be FULLY_RECEIVED to submit to accounting");
            }
            // Strict check
            if (po.warehouse && !po.warehouse.isWip) {
                 // throw new Error("PO Warehouse must be WIP (isWip=true)");
            }

            // 3. Generate Invoice Number
            const invoiceNumber = await generateInvoiceNumberInternal(tx);

            // 4. Create SupplierInvoice
            const invoice = await tx.supplierInvoice.create({
                data: {
                    invoiceNumber,
                    invoiceDate: new Date(),
                    dueDate: new Date(),
                    status: 'UNVERIFIED',
                    supplierId: po.supplierId,
                    purchaseOrderId: po.id,
                    subtotal: po.subtotal,
                    taxAmount: po.taxAmount,
                    totalAmount: po.totalAmount,
                    amountPaid: 0,
                    items: {
                        create: po.lines.map(line => ({
                            productId: line.productId,
                            productName: line.description || "Product",
                            quantity: line.quantity,
                            unitPrice: line.unitPrice,
                            totalPrice: line.totalAmount,
                            poLineId: line.id
                        }))
                    }
                }
            });

            // 5. Update PO Status
            await tx.purchaseOrder.update({
                where: { id },
                data: { status: 'UNVERIFIED_ACCOUNTING' }
            });

            return invoice;
        });

        return res.status(200).json({ success: true, message: "Successfully submitted to accounting", data: result });
    } catch (error) {
        console.error("Error submitting to accounting:", error);
        return res.status(400).json({ success: false, error: error.message });
    }
};
