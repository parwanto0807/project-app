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

  // 2. Filter only purchase items (PEMBELIAN_BARANG and JASA_PEMBELIAN)
  const purchaseItems = pr.details.filter(
    detail => detail.sourceProduct === 'PEMBELIAN_BARANG' || detail.sourceProduct === 'JASA_PEMBELIAN'
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
      if (hasReceipts) {
        return res.status(400).json({ 
          success: false, 
          error: "PO tidak bisa dibatalkan karena sudah ada penerimaan barang." 
        });
      }
    }

    // Update PO status dan jumlahDipesan jika APPROVED
    const result = await prisma.$transaction(async (tx) => {
      // Update PO status
      const updatedPO = await tx.purchaseOrder.update({
        where: { id },
        data: { status },
        include: {
          lines: {
            include: {
              prDetail: true
            }
          }
        }
      });

      // Jika status APPROVED, update jumlahDipesan di PurchaseRequestDetail dan onPR di StockBalance
      if (status === 'APPROVED') {
        // Get current period (start of month)
        const currentPeriod = new Date();
        currentPeriod.setDate(1);
        currentPeriod.setHours(0, 0, 0, 0);

        for (const line of updatedPO.lines) {
          if (line.prDetailId) {
            // Recalculate Total Ordered Qty for this PR Detail
            // This ensures data consistency even if PO status changes back and forth
            const totalOrdered = await tx.purchaseOrderLine.aggregate({
              where: {
                prDetailId: line.prDetailId,
                purchaseOrder: {
                  status: 'APPROVED'
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

          // Update StockBalance.onPR untuk product ini di warehouse PO
          // Increment onPR dengan qty dari PO line
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
                  increment: line.quantity
                },
                bookedStock: {
                  increment: line.quantity
                }
              }
            });
          } else {
            // Create StockBalance if not exists for current period
            await tx.stockBalance.create({
              data: {
                productId: line.productId,
                warehouseId: updatedPO.warehouseId,
                period: currentPeriod,
                onPR: line.quantity,
                stockAwal: 0,
                stockIn: 0,
                stockOut: 0,
                stockAkhir: 0,
                bookedStock: line.quantity,
                availableStock: 0
              }
            });
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