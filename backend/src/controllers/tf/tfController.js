import { prisma } from '../../config/db.js';

/**
 * @desc Create new stock transfer
 * @route POST /api/tf
 */
export const createTransfer = async (req, res) => {
  const { fromWarehouseId, toWarehouseId, senderId, notes, items } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Generate transfer number (Format: TF-YYYYMM-XXXX)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `TF-${year}${month}`;

      // Find last transfer with this prefix
      const lastTransfer = await tx.stockTransfer.findFirst({
        where: {
          transferNumber: {
            startsWith: prefix
          }
        },
        orderBy: {
          transferNumber: 'desc'
        }
      });

      let sequence = 1;
      if (lastTransfer) {
        const parts = lastTransfer.transferNumber.split('-');
        if (parts.length === 3) {
          const lastSeq = parseInt(parts[2]);
          if (!isNaN(lastSeq)) {
            sequence = lastSeq + 1;
          }
        }
      }

      const transferNumber = `${prefix}-${String(sequence).padStart(4, '0')}`;

      // Create transfer
      const transfer = await tx.stockTransfer.create({
        data: {
          transferNumber,
          fromWarehouseId,
          toWarehouseId,
          senderId,
          notes,
          status: 'DRAFT',
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unit: item.unit
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          fromWarehouse: true,
          toWarehouse: true,
          sender: true
        }
      });

      // ============================================
      // UPDATE STOCK BALANCE (BOOKING)
      // ============================================
      const periodDate = new Date();
      periodDate.setDate(1);
      periodDate.setHours(0, 0, 0, 0);
      periodDate.setMinutes(0);
      periodDate.setSeconds(0);
      periodDate.setMilliseconds(0);

      console.log('🔄 Updating Stock Balance for period:', periodDate);

      for (const item of items) {
        // Update sender warehouse stock balance
        // Increase bookedStock, Decrease availableStock
        const updateResult = await tx.stockBalance.updateMany({
          where: {
            productId: item.productId,
            warehouseId: fromWarehouseId,
            period: periodDate
          },
          data: {
            bookedStock: { increment: parseFloat(item.quantity) },
            availableStock: { decrement: parseFloat(item.quantity) }
          }
        });

        console.log(`📦 Updated Stock for Product ${item.productId}:`, updateResult);

        if (updateResult.count === 0) {
          console.warn(`⚠️ No StockBalance found for Product ${item.productId} in Warehouse ${fromWarehouseId} for period ${periodDate}`);
          // Optional: Create if not exists? Usually stock must exist to be transferred.
        }
      }



      // ============================================
      // AUTO-CREATE MATERIAL REQUISITION (PENDING)
      // ============================================
      
      // Generate MR Number (Format: MR-YYYYMM-XXXX)
      const mrNow = new Date();
      const mrYear = mrNow.getFullYear();
      const mrMonth = String(mrNow.getMonth() + 1).padStart(2, '0');
      const mrPrefix = `MR-${mrYear}${mrMonth}`;

      // Find last MR with this prefix
      const lastMR = await tx.materialRequisition.findFirst({
        where: {
          mrNumber: {
            startsWith: mrPrefix
          }
        },
        orderBy: {
          mrNumber: 'desc'
        }
      });

      let mrSequence = 1;
      if (lastMR) {
        const parts = lastMR.mrNumber.split('-');
        if (parts.length === 3) {
           const lastSeq = parseInt(parts[2]);
           if (!isNaN(lastSeq)) {
             mrSequence = lastSeq + 1;
           }
        }
      }

      const mrNumber = `${mrPrefix}-${String(mrSequence).padStart(4, '0')}`;

      // Create MR
      await tx.materialRequisition.create({
        data: {
          mrNumber,
          projectId: null, // Transfer antar gudang tidak selalu ada project
          requestedById: senderId, // Sender = Karyawan ID
          warehouseId: fromWarehouseId,
          status: 'PENDING',
          // Add context that this MR is from an Internal Transfer
          notes: `AUTO-GENERATED-TRANSFER: Internal Stock Transfer [${transferNumber}] to: ${transfer.toWarehouse?.name || toWarehouseId}. ${notes ? `(${notes})` : ''}`,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              qtyRequested: item.quantity,
              qtyIssued: 0,
              unit: item.unit
            }))
          }
        }
      });

      // ============================================
      // AUTO-CREATE GOODS RECEIPT (DRAFT)
      // ============================================

      // 1. Get User ID from Sender (Karyawan)
      const senderKaryawan = await tx.karyawan.findUnique({
        where: { id: senderId },
        select: { userId: true }
      });

      // We need a valid User ID for receivedById. If Karyawan doesn't have a user, 
      // we might fail or use a system user. For now, we assume sender has a user or fail.
      // If null, we'll try to use the first admin or just fail if strictly required.
      // Strict behavior:
      if (!senderKaryawan?.userId) {
          console.warn('⚠️ Sender Karyawan does not have a linked User Account. GR created with system fallback or might fail if foreign key enforced.');
          // Note: In a real app, you might want to stop here.
          // For now, let's proceed and if it fails, the transaction rolls back.
          // Optimistically assuming widespread usage of linked users.
      }

      const receivedById = senderKaryawan?.userId; 

      if (receivedById) {
          // 2. Generate GR Number
          const grNow = new Date();
          const grYear = grNow.getFullYear();
          const grMonth = String(grNow.getMonth() + 1).padStart(2, '0');
          const grPrefix = `GRN-${grYear}${grMonth}`;

          const lastGR = await tx.goodsReceipt.findFirst({
            where: { grNumber: { startsWith: grPrefix } },
            orderBy: { grNumber: 'desc' },
            select: { grNumber: true }
          });

          let grSequence = 1;
          if (lastGR) {
            const match = lastGR.grNumber.match(/GRN-\d{6}-(\d{4})$/);
            if (match) {
              grSequence = parseInt(match[1]) + 1;
            }
          }
          const grNumber = `${grPrefix}-${String(grSequence).padStart(4, '0')}`;

          // 3. Create GR Header
          const newGR = await tx.goodsReceipt.create({
            data: {
              grNumber,
              receivedDate: null, // Not received yet
              expectedDate: new Date(), // Expected today/soon
              vendorDeliveryNote: transferNumber, // Use Transfer Number as reference
              vehicleNumber: null,
              driverName: null,
              warehouseId: toWarehouseId,
              receivedById: receivedById,
              sourceType: 'TRANSFER',
              status: 'DRAFT',
              notes: `AUTO-GENERATED-TRANSFER: Incoming Transfer from: ${transfer.fromWarehouse?.name || fromWarehouseId} [${transferNumber}]. ${notes || ''}`,
              items: {
                create: items.map(item => ({
                  productId: item.productId,
                  qtyPlanReceived: item.quantity,
                  qtyReceived: 0, 
                  qtyPassed: 0,
                  qtyRejected: 0,
                  unit: item.unit,
                  status: 'RECEIVED', // Default initial status
                  qcStatus: 'PENDING'
                }))
              }
            }
          });
          
          console.log(`✅ Auto-created GR: ${newGR.grNumber}`);
      }

      return transfer;
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Transfer berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc Get all stock transfers with pagination and filters
 * @route GET /api/tf
 */
export const getAllTransfers = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    fromWarehouseId,
    toWarehouseId,
    startDate,
    endDate
  } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      AND: [
        search ? {
          OR: [
            { transferNumber: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        status ? { status } : {},
        fromWarehouseId ? { fromWarehouseId } : {},
        toWarehouseId ? { toWarehouseId } : {},
        startDate ? { transferDate: { gte: new Date(startDate) } } : {},
        endDate ? { transferDate: { lte: new Date(endDate) } } : {}
      ]
    };

    const [transfers, totalCount] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          sender: true,
          receiver: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockTransfer.count({ where })
    ]);

    // Fetch related Material Requisitions (qrToken) & Goods Receipts
    const transferNumbers = transfers.map(t => t.transferNumber);
    
    // 1. Find MRs
    const mrs = await prisma.materialRequisition.findMany({
      where: {
        OR: transferNumbers.map(tn => ({
          notes: { contains: `[${tn}]` }
        }))
      },
      select: {
        notes: true,
        qrToken: true
      }
    });

    // 2. Find GRs (vendorDeliveryNote matches transferNumber)
    const grs = await prisma.goodsReceipt.findMany({
        where: {
            vendorDeliveryNote: { in: transferNumbers }
        },
        select: {
            id: true,
            vendorDeliveryNote: true,
            status: true
        }
    });

    const data = transfers.map(transfer => {
      // Find the MR relevant to this transfer
      const relevantMr = mrs.find(mr => mr.notes && mr.notes.includes(`[${transfer.transferNumber}]`));
      // Find the GR relevant to this transfer
      const relevantGr = grs.find(gr => gr.vendorDeliveryNote === transfer.transferNumber);

      return {
        ...transfer,
        qrToken: relevantMr ? relevantMr.qrToken : null,
        goodsReceiptId: relevantGr ? relevantGr.id : null,
        goodsReceiptStatus: relevantGr ? relevantGr.status : null
      };
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc Get single transfer by ID
 * @route GET /api/tf/:id
 */
export const getTransferById = async (req, res) => {
  const { id } = req.params;

  try {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        sender: {
          include: {
            user: true
          }
        },
        receiver: {
          include: {
            user: true
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc Update transfer status
 * @route PATCH /api/tf/:id/status
 */
export const updateTransferStatus = async (req, res) => {
  const { id } = req.params;
  const { status, receiverId } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!transfer) {
        throw new Error('Transfer tidak ditemukan');
      }

      // Validate status transition
      const validTransitions = {
        DRAFT: ['PENDING', 'CANCELLED'],
        PENDING: ['IN_TRANSIT', 'CANCELLED'],
        IN_TRANSIT: ['RECEIVED', 'CANCELLED'],
        RECEIVED: [],
        CANCELLED: []
      };

      if (!validTransitions[transfer.status].includes(status)) {
        throw new Error(`Tidak dapat mengubah status dari ${transfer.status} ke ${status}`);
      }

      // If changing to IN_TRANSIT, deduct stock from source warehouse
      if (status === 'IN_TRANSIT' && transfer.status === 'PENDING') {
        const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

        for (const item of transfer.items) {
          // Deduct from source warehouse using FIFO
          const stockDetails = await tx.stockDetail.findMany({
            where: {
              productId: item.productId,
              warehouseId: transfer.fromWarehouseId,
              residualQty: { gt: 0 }
            },
            orderBy: { receivedDate: 'asc' }
          });

          let remainingQty = Number(item.quantity);
          let totalCost = 0; // Track total cost for this item

          for (const detail of stockDetails) {
            if (remainingQty <= 0) break;

            const deductQty = Math.min(Number(detail.residualQty), remainingQty);
            const price = Number(detail.pricePerUnit || 0);
            
            await tx.stockDetail.update({
              where: { id: detail.id },
              data: {
                residualQty: { decrement: deductQty }
              }
            });

            totalCost += deductQty * price;
            remainingQty -= deductQty;
          }

          // Update StockTransferItem with the calculated COGS
          await tx.stockTransferItem.update({
             where: { id: item.id },
             data: { cogs: totalCost }
          });

          // Update stock balance
          const stockBalance = await tx.stockBalance.findFirst({
            where: {
              productId: item.productId,
              warehouseId: transfer.fromWarehouseId,
              period: currentPeriod
            }
          });

          if (stockBalance) {
            await tx.stockBalance.update({
              where: { id: stockBalance.id },
              data: {
                qtyOut: { increment: item.quantity },
                endingStock: { decrement: item.quantity }
              }
            });
          }
        }
      }

      // If changing to RECEIVED, add stock to destination warehouse
      if (status === 'RECEIVED' && transfer.status === 'IN_TRANSIT') {
        if (!receiverId) {
          throw new Error('receiverId diperlukan untuk status RECEIVED');
        }

        const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

        for (const item of transfer.items) {
          // Create stock detail for destination warehouse
          await tx.stockDetail.create({
            data: {
              productId: item.productId,
              warehouseId: transfer.toWarehouseId,
              batchNumber: `TF-${transfer.transferNumber}`,
              receivedDate: new Date(),
              receivedQty: item.quantity,
              residualQty: item.quantity,
              pricePerUnit: 0, // Transfer doesn't change value
              stockAwalSnapshot: 0,
              stockMasukSnapshot: item.quantity,
              stockKeluarSnapshot: 0,
              stockAkhirSnapshot: item.quantity
            }
          });

          // Update stock balance for destination
          const stockBalance = await tx.stockBalance.findFirst({
            where: {
              productId: item.productId,
              warehouseId: transfer.toWarehouseId,
              period: currentPeriod
            }
          });

          if (stockBalance) {
            await tx.stockBalance.update({
              where: { id: stockBalance.id },
              data: {
                qtyIn: { increment: item.quantity },
                endingStock: { increment: item.quantity }
              }
            });
          } else {
            await tx.stockBalance.create({
              data: {
                productId: item.productId,
                warehouseId: transfer.toWarehouseId,
                period: currentPeriod,
                openingStock: 0,
                qtyIn: item.quantity,
                qtyOut: 0,
                endingStock: item.quantity,
                inventoryValue: 0
              }
            });
          }
        }
      }

      // Update transfer
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id },
        data: {
          status,
          ...(receiverId && { receiverId })
        },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          sender: true,
          receiver: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      return updatedTransfer;
    });

    res.json({
      success: true,
      data: result,
      message: 'Status transfer berhasil diubah'
    });
  } catch (error) {
    console.error('Error updating transfer status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc Cancel transfer
 * @route DELETE /api/tf/:id
 */
export const cancelTransfer = async (req, res) => {
  const { id } = req.params;

  try {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id }
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer tidak ditemukan'
      });
    }

    if (transfer.status === 'RECEIVED') {
      return res.status(400).json({
        success: false,
        error: 'Transfer yang sudah diterima tidak dapat dibatalkan'
      });
    }

    const updatedTransfer = await prisma.stockTransfer.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({
      success: true,
      data: updatedTransfer,
      message: 'Transfer berhasil dibatalkan'
    });
  } catch (error) {
    console.error('Error cancelling transfer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc Manually create GR for a Transfer (if missing)
 * @route POST /api/tf/:id/create-gr
 */
export const createTransferGR = async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch Transfer with Items
        const transfer = await tx.stockTransfer.findUnique({
            where: { id },
            include: {
                // To get sender's user ID
                sender: {
                    select: { userId: true }
                },
                items: true
            }
        });

        if (!transfer) {
            throw new Error('Transfer tidak ditemukan');
        }

        // 2. Check if GR already exists
        const existingGR = await tx.goodsReceipt.findFirst({
            where: { vendorDeliveryNote: transfer.transferNumber }
        });

        if (existingGR) {
            throw new Error(`Goods Receipt sudah ada: ${existingGR.grNumber}`);
        }

        // 3. Get Receiver ID (Sender's User ID or req.user.id)
        // If system is triggering this, we prefer using the sender's linked user.
        // If manually triggered by logged in user, maybe use req.user.id?
        // But let's stick to the auto-logic for consistency: use Sender's User ID.
        let receivedById = transfer.sender?.userId;
        
        // If sender has no user, try to use the current user from request (if middleware populates it)
        if (!receivedById && req.user?.id) {
            receivedById = req.user.id;
        }

        if (!receivedById) {
            // Last resort: find any admin or active user? Or just fail.
            // Let's fail for safety.
            throw new Error('Tidak dapat menentukan User ID penerima (Sender tidak memiliki akun user)');
        }

        // 4. Generate GR Number
        const grNow = new Date();
        const grYear = grNow.getFullYear();
        const grMonth = String(grNow.getMonth() + 1).padStart(2, '0');
        const grPrefix = `GRN-${grYear}${grMonth}`;

        const lastGR = await tx.goodsReceipt.findFirst({
            where: { grNumber: { startsWith: grPrefix } },
            orderBy: { grNumber: 'desc' },
            select: { grNumber: true }
        });

        let grSequence = 1;
        if (lastGR) {
            const match = lastGR.grNumber.match(/GRN-\d{6}-(\d{4})$/);
            if (match) {
            grSequence = parseInt(match[1]) + 1;
            }
        }
        const grNumber = `${grPrefix}-${String(grSequence).padStart(4, '0')}`;

        // 5. Create GR Header
        const newGR = await tx.goodsReceipt.create({
            data: {
            grNumber,
            receivedDate: null, 
            expectedDate: new Date(),
            vendorDeliveryNote: transfer.transferNumber,
            vehicleNumber: null,
            driverName: null,
            warehouseId: transfer.toWarehouseId,
            receivedById: receivedById,
            sourceType: 'TRANSFER', // Set source type
            status: 'DRAFT',
            notes: `MANUAL-GENERATED-TRANSFER: Incoming Transfer from Warehouse ID: ${transfer.fromWarehouseId} [${transfer.transferNumber}]. ${transfer.items.map(i => `${i.product ? i.product.name : 'Unknown Product'} (${i.quantity} ${i.unit})`).join(', ')}`,
            items: {
                create: transfer.items.map(item => ({
                productId: item.productId,
                qtyPlanReceived: item.quantity,
                qtyReceived: 0,
                qtyPassed: 0,
                qtyRejected: 0,
                unit: item.unit,
                status: 'RECEIVED',
                qcStatus: 'PENDING'
                }))
            }
            }
        });

        return newGR;
      });
  
      res.status(201).json({
        success: true,
        data: result,
        message: 'Goods Receipt berhasil dibuat (Draft)'
      });
    } catch (error) {
      console.error('Error creating manual GR:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
