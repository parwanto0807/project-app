import { prisma } from '../../config/db.js';

/**
 * @desc Create new stock transfer
 * @route POST /api/tf
 */
export const createTransfer = async (req, res) => {
  const { fromWarehouseId, toWarehouseId, senderId, notes, items } = req.body;

  try {
    // Add timeout to prevent transaction from hanging
    const result = await prisma.$transaction(async (tx) => {
      // Generate transfer number (Format: TF-YYYYMM-XXXX) with retry
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
        },
        select: { transferNumber: true } // Only select for speed
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

      // Create transfer with retry logic
      let transfer = null;
      let tfRetryCount = 0;
      const tfMaxRetries = 3;

      while (tfRetryCount < tfMaxRetries) {
        const transferNumber = `${prefix}-${String(sequence + tfRetryCount).padStart(4, '0')}`;

        try {
          transfer = await tx.stockTransfer.create({
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
          
          ;(() => {})(`✅ Created Transfer: ${transfer.transferNumber}`);
          break; // Success
        } catch (error) {
          if (error.code === 'P2002' && tfRetryCount < tfMaxRetries - 1) {
            ;(() => {})(`⚠️ TF number ${transferNumber} already exists, retrying...`);
            tfRetryCount++;
          } else {
            throw error;
          }
        }
      }

      if (!transfer) {
        throw new Error('Failed to create transfer after multiple retries');
      }

      // ============================================
      // UPDATE STOCK BALANCE (BOOKING)
      // ============================================
      // IMPORTANT: Use proper period date format (UTC midnight anchored to Jakarta date)
      // Same logic as mrController.js line 97-99
      const jakartaNow = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // shift to WIB
      const periodDate = new Date(Date.UTC(jakartaNow.getUTCFullYear(), jakartaNow.getUTCMonth(), 1));

      ;(() => {})('🔄 Updating Stock Balance for period:', periodDate);

      for (const item of items) {
        // ============================================
        // CONVERT UNIT TO STORAGE UNIT (BASE UNIT)
        // ============================================
        // Get product to check units and conversion ratios
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            storageUnit: true,
            usageUnit: true,
            purchaseUnit: true,
            conversionToUsage: true,
            conversionToStorage: true
          }
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        // Calculate quantity in storage unit (base unit)
        let quantityInStorageUnit = parseFloat(item.quantity);
        
        if (item.unit === product.usageUnit && product.usageUnit !== product.storageUnit) {
          // User input in usageUnit (e.g., Liter), convert to storageUnit (e.g., Kg)
          // Formula: storageQty = usageQty / conversionToUsage
          const conversion = Number(product.conversionToUsage) || 1;
          quantityInStorageUnit = parseFloat(item.quantity) / conversion;
          
          ;(() => {})(`🔄 Unit conversion: ${item.quantity} ${item.unit} → ${quantityInStorageUnit} ${product.storageUnit} (÷ ${conversion})`);
        } else if (item.unit === product.purchaseUnit && product.purchaseUnit !== product.storageUnit) {
          // User input in purchaseUnit (e.g., Box), convert to storageUnit (e.g., Pcs)
          // Formula: storageQty = purchaseQty × conversionToStorage
          const conversion = Number(product.conversionToStorage) || 1;
          quantityInStorageUnit = parseFloat(item.quantity) * conversion;
          
          ;(() => {})(`🔄 Unit conversion: ${item.quantity} ${item.unit} → ${quantityInStorageUnit} ${product.storageUnit} (× ${conversion})`);
        } else {
          ;(() => {})(`✅ No conversion needed: ${item.quantity} ${item.unit} = ${quantityInStorageUnit} ${product.storageUnit}`);
        }

        // Update sender warehouse stock balance
        // Increase bookedStock, Decrease availableStock (in storage unit)
        const updateResult = await tx.stockBalance.updateMany({
          where: {
            productId: item.productId,
            warehouseId: fromWarehouseId,
            period: periodDate
          },
          data: {
            bookedStock: { increment: quantityInStorageUnit },
            availableStock: { decrement: quantityInStorageUnit }
          }
        });

        ;(() => {})(`📦 Updated Stock for Product ${item.productId}: Booked +${quantityInStorageUnit}, Available -${quantityInStorageUnit}`, updateResult);

        if (updateResult.count === 0) {
          console.warn(`⚠️ No StockBalance found for Product ${item.productId} in Warehouse ${fromWarehouseId} for period ${periodDate}`);
        }
      }



      // ============================================
      // AUTO-CREATE MATERIAL REQUISITION (PENDING)
      // ============================================
      
      // Generate MR Number (Format: MR-YYYYMM-XXXX)
      // Use transfer data instead of re-fetching to avoid transaction timeout
      const mrYear = now.getFullYear();
      const mrMonth = String(now.getMonth() + 1).padStart(2, '0');
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
        },
        select: { mrNumber: true } // Only select mrNumber for speed
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

      // Create MR with retry logic for unique constraint
      let createdMR = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        const mrNumber = `${mrPrefix}-${String(mrSequence + retryCount).padStart(4, '0')}`;
        
        try {
          createdMR = await tx.materialRequisition.create({
            data: {
              mrNumber,
              projectId: null,
              requestedById: senderId,
              warehouseId: fromWarehouseId,
              status: 'PENDING',
              notes: `AUTO-GENERATED-TRANSFER: Internal Stock Transfer [${transfer.transferNumber}] to: ${toWarehouseId}. ${notes ? `(${notes})` : ''}`,
              items: {
                create: items.map(item => ({
                  productId: item.productId,
                  qtyRequested: item.quantity,
                  qtyIssued: 0,
                  unit: item.unit
                }))
              }
            },
            select: { id: true, mrNumber: true }
          });
          
          ;(() => {})(`✅ Auto-created MR: ${createdMR.mrNumber}`);
          break; // Success, exit retry loop
        } catch (error) {
          if (error.code === 'P2002' && retryCount < maxRetries - 1) {
            // Unique constraint failed, retry with next sequence
            ;(() => {})(`⚠️ MR number ${mrNumber} already exists, retrying with next sequence...`);
            retryCount++;
          } else {
            throw error; // Re-throw if max retries reached or different error
          }
        }
      }

      if (!createdMR) {
        throw new Error('Failed to create MR after multiple retries');
      }

      // Get sender user ID for GR (reuse from earlier)
      const senderKaryawan = await tx.karyawan.findUnique({
        where: { id: senderId },
        select: { userId: true }
      });

      const receivedById = senderKaryawan?.userId;

      // ============================================
      // AUTO-CREATE GOODS RECEIPT (DRAFT)
      // ============================================

      if (receivedById) {
          // Generate GR Number
          const grYear = now.getFullYear();
          const grMonth = String(now.getMonth() + 1).padStart(2, '0');
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

          // Create GR with retry logic for unique constraint
          let newGR = null;
          let grRetryCount = 0;
          const grMaxRetries = 3;

          while (grRetryCount < grMaxRetries) {
            const grNumber = `${grPrefix}-${String(grSequence + grRetryCount).padStart(4, '0')}`;

            try {
              newGR = await tx.goodsReceipt.create({
                data: {
                  grNumber,
                  receivedDate: null,
                  expectedDate: now,
                  vendorDeliveryNote: transfer.transferNumber,
                  vehicleNumber: null,
                  driverName: null,
                  warehouseId: toWarehouseId,
                  receivedById: receivedById,
                  sourceType: 'TRANSFER',
                  status: 'DRAFT',
                  notes: `AUTO-GENERATED-TRANSFER: Incoming Transfer from: ${fromWarehouseId} [${transfer.transferNumber}]. ${notes || ''}`,
                  items: {
                    create: items.map(item => ({
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
                },
                select: { id: true, grNumber: true }
              });
              
              ;(() => {})(`✅ Auto-created GR: ${newGR.grNumber}`);
              break; // Success
            } catch (error) {
              if (error.code === 'P2002' && grRetryCount < grMaxRetries - 1) {
                ;(() => {})(`⚠️ GR number ${grNumber} already exists, retrying...`);
                grRetryCount++;
              } else {
                throw error;
              }
            }
          }

          if (!newGR) {
            console.warn('⚠️ Failed to create GR after retries, but continuing (GR is optional)');
          }
      }

      return transfer;
    }, {
      timeout: 30000, // 30 seconds timeout
      maxWait: 35000  // Max wait 35 seconds
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
 * @desc Update draft stock transfer
 * @route PUT /api/tf/:id
 */
export const updateTransfer = async (req, res) => {
  const { id } = req.params;
  const { fromWarehouseId, toWarehouseId, senderId, notes, items } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get existing transfer with items
      const existingTransfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: {
          items: true,
          fromWarehouse: true,
          toWarehouse: true
        }
      });

      if (!existingTransfer) {
        throw new Error('Transfer tidak ditemukan');
      }

      if (existingTransfer.status !== 'DRAFT') {
        throw new Error('Hanya transfer dengan status DRAFT yang dapat diedit');
      }

      const periodDate = new Date();
      periodDate.setDate(1);
      periodDate.setHours(0, 0, 0, 0);
      periodDate.setMinutes(0);
      periodDate.setSeconds(0);
      periodDate.setMilliseconds(0);

      // 2. Rollback previous stock booking
      for (const oldItem of existingTransfer.items) {
        await tx.stockBalance.updateMany({
          where: {
            productId: oldItem.productId,
            warehouseId: existingTransfer.fromWarehouseId,
            period: periodDate
          },
          data: {
            bookedStock: { decrement: parseFloat(oldItem.quantity) },
            availableStock: { increment: parseFloat(oldItem.quantity) }
          }
        });
      }

      // 3. Delete old items
      await tx.stockTransferItem.deleteMany({
        where: { stockTransferId: id }
      });

      // 4. Update Transfer Header
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id },
        data: {
          fromWarehouseId,
          toWarehouseId,
          senderId,
          notes,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unit: item.unit
            }))
          }
        },
        include: {
          items: { include: { product: true } },
          fromWarehouse: true,
          toWarehouse: true,
          sender: true
        }
      });

      // 5. Apply new stock booking
      for (const item of items) {
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
        if (updateResult.count === 0) {
          console.warn(`⚠️ No StockBalance found for Product ${item.productId} in Warehouse ${fromWarehouseId} for period ${periodDate}`);
        }
      }

      // 6. Update linked Material Requisition
      const existingMR = await tx.materialRequisition.findFirst({
        where: { notes: { contains: `[${existingTransfer.transferNumber}]` } },
        include: { items: true }
      });

      if (existingMR) {
        await tx.materialRequisitionItem.deleteMany({
          where: { materialRequisitionId: existingMR.id }
        });
        await tx.materialRequisition.update({
          where: { id: existingMR.id },
          data: {
            warehouseId: fromWarehouseId,
            requestedById: senderId,
            notes: `AUTO-GENERATED-TRANSFER: Internal Stock Transfer [${existingTransfer.transferNumber}] to: ${updatedTransfer.toWarehouse?.name || toWarehouseId}. ${notes ? `(${notes})` : ''}`,
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
      }

      // 7. Update linked Goods Receipt
      const existingGR = await tx.goodsReceipt.findFirst({
        where: { vendorDeliveryNote: existingTransfer.transferNumber },
        include: { items: true }
      });

      if (existingGR) {
        const senderKaryawan = await tx.karyawan.findUnique({
          where: { id: senderId },
          select: { userId: true }
        });
        const receivedById = senderKaryawan?.userId || existingGR.receivedById;

        await tx.goodsReceiptItem.deleteMany({
          where: { goodsReceiptId: existingGR.id }
        });

        await tx.goodsReceipt.update({
          where: { id: existingGR.id },
          data: {
            warehouseId: toWarehouseId,
            receivedById,
            notes: `AUTO-GENERATED-TRANSFER: Incoming Transfer from: ${updatedTransfer.fromWarehouse?.name || fromWarehouseId} [${existingTransfer.transferNumber}]. ${notes || ''}`,
            items: {
              create: items.map(item => ({
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
      }

      return updatedTransfer;
    });

    res.json({
      success: true,
      data: result,
      message: 'Transfer berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating transfer:', error);
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
            // Recalculate availableStock = stockAkhir - bookedStock
            const currentStockAkhir = parseFloat(stockBalance.stockAkhir) || 0;
            const newStockAkhir = Math.max(0, currentStockAkhir - parseFloat(item.quantity));
            const currentBooked = parseFloat(stockBalance.bookedStock) || 0;
            const newAvailable = Math.max(0, newStockAkhir - currentBooked);
            // Clear inventoryValue when stock reaches 0
            const currentInvValue = parseFloat(stockBalance.inventoryValue) || 0;
            const newInvValue = newStockAkhir <= 0 ? 0 : currentInvValue;

            await tx.stockBalance.update({
              where: { id: stockBalance.id },
              data: {
                stockOut: { increment: item.quantity },
                stockAkhir: { set: newStockAkhir },
                bookedStock: { decrement: parseFloat(item.quantity) },
                availableStock: { set: newAvailable },
                inventoryValue: { set: newInvValue }
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
            const currentStockAkhir = parseFloat(stockBalance.stockAkhir) || 0;
            const newStockAkhir = currentStockAkhir + parseFloat(item.quantity);
            const currentBooked = parseFloat(stockBalance.bookedStock) || 0;
            const newAvailable = Math.max(0, newStockAkhir - currentBooked);

            await tx.stockBalance.update({
              where: { id: stockBalance.id },
              data: {
                stockIn: { increment: item.quantity },
                stockAkhir: { set: newStockAkhir },
                availableStock: { set: newAvailable }
              }
            });
          } else {
            await tx.stockBalance.create({
              data: {
                productId: item.productId,
                warehouseId: transfer.toWarehouseId,
                period: new Date(currentPeriod + '-01'),
                stockAwal: 0,
                stockIn: item.quantity,
                stockOut: 0,
                stockAkhir: item.quantity,
                availableStock: item.quantity,
                bookedStock: 0,
                onPR: 0,
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
    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!transfer) {
        throw new Error('Transfer tidak ditemukan');
      }

      if (transfer.status === 'RECEIVED') {
        throw new Error('Transfer yang sudah diterima tidak dapat dibatalkan');
      }

      // Reverse stock booking when cancelling
      if (transfer.status !== 'CANCELLED') {
        // IMPORTANT: Use proper period date format (UTC midnight anchored to Jakarta date)
        const now = new Date();
        const jakartaNow = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // shift to WIB
        const periodDate = new Date(Date.UTC(jakartaNow.getUTCFullYear(), jakartaNow.getUTCMonth(), 1));

        ;(() => {})(`🔄 Releasing stock booking for cancelled transfer, period:`, periodDate);

        for (const item of transfer.items) {
          // ============================================
          // CONVERT UNIT TO STORAGE UNIT (BASE UNIT)
          // ============================================
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: {
              storageUnit: true,
              usageUnit: true,
              purchaseUnit: true,
              conversionToUsage: true,
              conversionToStorage: true
            }
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          // Calculate quantity in storage unit (base unit)
          let quantityInStorageUnit = parseFloat(item.quantity);
          
          if (item.unit === product.usageUnit && product.usageUnit !== product.storageUnit) {
            const conversion = Number(product.conversionToUsage) || 1;
            quantityInStorageUnit = parseFloat(item.quantity) / conversion;
            
            ;(() => {})(`🔄 Cancel conversion: ${item.quantity} ${item.unit} → ${quantityInStorageUnit} ${product.storageUnit} (÷ ${conversion})`);
          } else if (item.unit === product.purchaseUnit && product.purchaseUnit !== product.storageUnit) {
            const conversion = Number(product.conversionToStorage) || 1;
            quantityInStorageUnit = parseFloat(item.quantity) * conversion;
            
            ;(() => {})(`🔄 Cancel conversion: ${item.quantity} ${item.unit} → ${quantityInStorageUnit} ${product.storageUnit} (× ${conversion})`);
          } else {
            ;(() => {})(`✅ No conversion needed: ${item.quantity} ${item.unit} = ${quantityInStorageUnit} ${product.storageUnit}`);
          }

          // Release booked stock back to available (in storage unit)
          await tx.stockBalance.updateMany({
            where: {
              productId: item.productId,
              warehouseId: transfer.fromWarehouseId,
              period: periodDate
            },
            data: {
              bookedStock: { decrement: quantityInStorageUnit },
              availableStock: { increment: quantityInStorageUnit }
            }
          });

          ;(() => {})(`📦 Released Stock for Product ${item.productId}: Booked -${quantityInStorageUnit}, Available +${quantityInStorageUnit}`);
        }
      }

      const updatedTransfer = await tx.stockTransfer.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      return updatedTransfer;
    });

    res.json({
      success: true,
      data: result,
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
 * @desc Permanently delete a cancelled transfer and its related documents
 * @route DELETE /api/tf/:id/permanent
 */
export const deletePermanentTransfer = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!transfer) {
        throw new Error('Transfer tidak ditemukan');
      }

      if (transfer.status !== 'CANCELLED') {
        throw new Error('Hanya transfer berstatus CANCELLED yang dapat dihapus permanen');
      }

      // Rollback stock booking since cancel might not have done it
      // IMPORTANT: Use proper period date format (UTC midnight anchored to Jakarta date)
      const now = new Date();
      const jakartaNow = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // shift to WIB
      const periodDate = new Date(Date.UTC(jakartaNow.getUTCFullYear(), jakartaNow.getUTCMonth(), 1));

      ;(() => {})(`🔄 Rolling back stock booking for period:`, periodDate);

      for (const item of transfer.items) {
        // ============================================
        // CONVERT UNIT TO STORAGE UNIT (BASE UNIT)
        // ============================================
        // Get product to check units and conversion ratios
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            storageUnit: true,
            usageUnit: true,
            purchaseUnit: true,
            conversionToUsage: true,
            conversionToStorage: true
          }
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        // Calculate quantity in storage unit (base unit)
        let quantityInStorageUnit = parseFloat(item.quantity);
        
        if (item.unit === product.usageUnit && product.usageUnit !== product.storageUnit) {
          // Item stored in usageUnit, convert to storageUnit
          const conversion = Number(product.conversionToUsage) || 1;
          quantityInStorageUnit = parseFloat(item.quantity) / conversion;
          
          ;(() => {})(`🔄 Rollback conversion: ${item.quantity} ${item.unit} → ${quantityInStorageUnit} ${product.storageUnit} (÷ ${conversion})`);
        } else if (item.unit === product.purchaseUnit && product.purchaseUnit !== product.storageUnit) {
          // Item stored in purchaseUnit, convert to storageUnit
          const conversion = Number(product.conversionToStorage) || 1;
          quantityInStorageUnit = parseFloat(item.quantity) * conversion;
          
          ;(() => {})(`🔄 Rollback conversion: ${item.quantity} ${item.unit} → ${quantityInStorageUnit} ${product.storageUnit} (× ${conversion})`);
        } else {
          ;(() => {})(`✅ No conversion needed: ${item.quantity} ${item.unit} = ${quantityInStorageUnit} ${product.storageUnit}`);
        }

        // Release booked stock back to available (in storage unit)
        await tx.stockBalance.updateMany({
          where: {
            productId: item.productId,
            warehouseId: transfer.fromWarehouseId,
            period: periodDate
          },
          data: {
            bookedStock: { decrement: quantityInStorageUnit },
            availableStock: { increment: quantityInStorageUnit }
          }
        });

        ;(() => {})(`📦 Released Stock for Product ${item.productId}: Booked -${quantityInStorageUnit}, Available +${quantityInStorageUnit}`);
      }

      // Find and delete MR
      const existingMR = await tx.materialRequisition.findFirst({
        where: { notes: { contains: `[${transfer.transferNumber}]` } }
      });
      if (existingMR) {
        await tx.materialRequisitionItem.deleteMany({ where: { materialRequisitionId: existingMR.id } });
        await tx.materialRequisition.delete({ where: { id: existingMR.id } });
      }

      // Find and delete GR
      const existingGR = await tx.goodsReceipt.findFirst({
        where: { vendorDeliveryNote: transfer.transferNumber }
      });
      if (existingGR) {
        await tx.goodsReceiptItem.deleteMany({ where: { goodsReceiptId: existingGR.id } });
        await tx.goodsReceipt.delete({ where: { id: existingGR.id } });
      }

      // Delete Transfer Items and Transfer
      await tx.stockTransferItem.deleteMany({ where: { transferId: id } });
      await tx.stockTransfer.delete({ where: { id } });

      return transfer;
    });

    res.json({
      success: true,
      data: result,
      message: 'Transfer berhasil dihapus permanen'
    });
  } catch (error) {
    console.error('Error permanently deleting transfer:', error);
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
