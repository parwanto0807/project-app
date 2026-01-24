import { prisma } from '../../config/db.js';
import { ApiResponse, ListResponse } from '../../validations/api.js';
import { updateTrialBalance, updateGeneralLedgerSummary } from '../../services/accounting/financialSummaryService.js';

/**
 * Helper: Get System Account by Key
 */
async function getSystemAccount(key, tx) {
  const prismaClient = tx || prisma;
  const systemAccount = await prismaClient.systemAccount.findUnique({
    where: { key },
    include: { coa: true }
  });

  return systemAccount?.coa || null;
}

/**
 * Helper: Get COA by Code
 */
async function getCOAByCode(code, tx) {
  const prismaClient = tx || prisma;
  return await prismaClient.chartOfAccounts.findUnique({
    where: { code }
  });
}

/**
 * Helper: Get Active Accounting Period
 */
async function getActivePeriod(transactionDate, tx) {
  const prismaClient = tx || prisma;
  const period = await prismaClient.accountingPeriod.findFirst({
    where: {
      startDate: { lte: transactionDate },
      endDate: { gte: transactionDate },
      isClosed: false
    }
  });

  if (!period) {
    throw new Error(`No open accounting period found for date ${transactionDate.toISOString().slice(0, 10)}`);
  }

  return period;
}

/**
 * Helper: Generate GR Ledger Number
 * Format: JV-GRN-YYYYMMDD-XXXX
 */
async function generateGRLedgerNumber(date, tx) {
  const prismaClient = tx || prisma;
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `JV-GRN-${dateStr}`;
  
  const latestLedger = await prismaClient.ledger.findFirst({
    where: {
      ledgerNumber: { startsWith: prefix }
    },
    orderBy: {
      ledgerNumber: 'desc'
    },
    select: {
      ledgerNumber: true
    }
  });

  let nextSequence = 1;
  if (latestLedger) {
    const parts = latestLedger.ledgerNumber.split('-');
    const lastSequenceStr = parts[parts.length - 1];
    const lastSequence = parseInt(lastSequenceStr);
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  const sequence = String(nextSequence).padStart(4, '0');
  return `${prefix}-${sequence}`;
}

/**
 * Helper: Generate GR Number within a transaction
 */
async function generateGRNumberWithinTx(tx) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `GRN-${year}${month}`;
  
  const latestGR = await tx.goodsReceipt.findFirst({
    where: { grNumber: { startsWith: prefix } },
    orderBy: { grNumber: 'desc' },
    select: { grNumber: true }
  });

  let nextNumber = 1;
  if (latestGR) {
    const match = latestGR.grNumber.match(/GRN-\d{6}-(\d{4})$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  const sequence = String(nextNumber).padStart(4, '0');
  return `${prefix}-${sequence}`;
}


/**
 * Get all Goods Receipts with pagination and filters
 */
export const getAllGoodsReceipts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'receivedDate',
      sortOrder = 'desc',
      search,
      startDate,
      endDate,
      status,
      warehouseId,
      purchaseOrderId,
      qcStatus,
      vendorId
    } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // Build filter conditions
    const where = {};

    if (search) {
      where.OR = [
        { grNumber: { contains: search, mode: 'insensitive' } },
        { vendorDeliveryNote: { contains: search, mode: 'insensitive' } },
        { vehicleNumber: { contains: search, mode: 'insensitive' } },
        { driverName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.receivedDate = {};
      if (startDate) {
        where.receivedDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.receivedDate.lte = new Date(endDate);
      }
    }

    if (status) {
      where.status = status;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (purchaseOrderId) {
      where.purchaseOrderId = purchaseOrderId;
    }

    // Filter by QC status through items
    if (qcStatus) {
      where.items = {
        some: {
          qcStatus: qcStatus
        }
      };
    }

    // Filter by vendor through purchaseOrder
    if (vendorId) {
      where.purchaseOrder = {
        vendorId: vendorId
      };
    }

    // Get total count
    const totalCount = await prisma.goodsReceipt.count({ where });

    // Get paginated data with related entities
    const goodsReceipts = await prisma.goodsReceipt.findMany({
      where,
      include: {
        PurchaseOrder: {
          include: {
            supplier: true,
            lines: {
              include: {
                product: true
              }
            }
          }
        },
        Warehouse: true,
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            },
            purchaseOrderLine: {
              include: {
                purchaseOrder: true
              }
            },
            purchaseRequestDetail: {
              include: {
                purchaseRequest: true
              }
            },
            stockDetail: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: pageSize
    });

    // Populate transferStatus for TRANSFER sourceType GRs
    const transferGRs = goodsReceipts.filter(gr => gr.sourceType === 'TRANSFER' && gr.vendorDeliveryNote);
    if (transferGRs.length > 0) {
      const transferNumbers = transferGRs.map(gr => gr.vendorDeliveryNote);
      const transfers = await prisma.stockTransfer.findMany({
        where: {
          transferNumber: { in: transferNumbers }
        },
        select: {
          transferNumber: true,
          status: true
        }
      });

      // Create a map for quick lookup
      const transferStatusMap = new Map(transfers.map(t => [t.transferNumber, t.status]));

      // Attach transferStatus to each GR
      goodsReceipts.forEach(gr => {
        if (gr.sourceType === 'TRANSFER' && gr.vendorDeliveryNote) {
          gr.transferStatus = transferStatusMap.get(gr.vendorDeliveryNote) || null;
        }
      });
    }
    // Calculate summary statistics
    const itemStats = await prisma.goodsReceiptItem.aggregate({
      where: {
        goodsReceipt: where
      },
      _sum: {
        qtyReceived: true,
        qtyPassed: true,
        qtyRejected: true
      },
      _count: {
        id: true
      }
    });

    // QC Status distribution
    const qcStatusDistribution = await prisma.goodsReceiptItem.groupBy({
      by: ['qcStatus'],
      where: {
        goodsReceipt: where
      },
      _count: {
        id: true
      }
    });

    const paginationMeta = {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: pageNumber,
      pageSize,
      hasNext: pageNumber < Math.ceil(totalCount / pageSize),
      hasPrev: pageNumber > 1
    };

    const response = new ApiResponse({
      success: true,
      data: new ListResponse({
        data: goodsReceipts,
        pagination: paginationMeta,
        summary: {
          totalItems: itemStats._count.id,
          totalQtyReceived: itemStats._sum.qtyReceived || 0,
          totalQtyPassed: itemStats._sum.qtyPassed || 0,
          totalQtyRejected: itemStats._sum.qtyRejected || 0,
          qcStatusDistribution,
          passingRate: itemStats._sum.qtyReceived 
            ? ((itemStats._sum.qtyPassed || 0) / itemStats._sum.qtyReceived * 100).toFixed(2)
            : 0
        }
      })
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching goods receipts:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to fetch goods receipts',
      details: error.message
    });
    res.status(500).json(response);
  }
};

/**
 * Get Goods Receipt by ID with detailed information
 */
export const getGoodsReceiptById = async (req, res) => {
  try {
    const { id } = req.params;

    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        PurchaseOrder: {
          include: {
            supplier: true,
            lines: {
              include: {
                product: true
              }
            }
          }
        },
        Warehouse: true,
        receivedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
                specifications: true
              }
            },
            PurchaseOrderLine: {
              include: {
                purchaseOrder: true,
                product: true
              }
            },
            PurchaseRequestDetail: {
              include: {
                purchaseRequest: true,
                product: true
              }
            },
            stockDetail: true
          },
          orderBy: {
            product: {
              name: 'asc'
            }
          }
        }
      }
    });

    if (!goodsReceipt) {
      const response = new ApiResponse({
        success: false,
        message: 'Goods receipt not found'
      });
      return res.status(404).json(response);
    }

    // Calculate QC summary
    const qcSummary = {
      totalItems: goodsReceipt.items.length,
      totalReceived: goodsReceipt.items.reduce((sum, item) => sum + parseFloat(item.qtyReceived), 0),
      totalPassed: goodsReceipt.items.reduce((sum, item) => sum + parseFloat(item.qtyPassed), 0),
      totalRejected: goodsReceipt.items.reduce((sum, item) => sum + parseFloat(item.qtyRejected), 0),
      qcStatusCounts: goodsReceipt.items.reduce((acc, item) => {
        acc[item.qcStatus] = (acc[item.qcStatus] || 0) + 1;
        return acc;
      }, {})
    };

    const response = new ApiResponse({
      success: true,
      data: {
        ...goodsReceipt,
        qcSummary
      }
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching goods receipt:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to fetch goods receipt',
      details: error.message
    });
    res.status(500).json(response);
  }
};


export const generateGRNumber = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `GRN-${year}${month}`;
  
  // Cari GR number terakhir untuk bulan ini
  const latestGR = await prisma.goodsReceipt.findFirst({
    where: {
      grNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      grNumber: 'desc'
    },
    select: {
      grNumber: true
    }
  });

  let nextNumber = 1;
  
  if (latestGR) {
    const match = latestGR.grNumber.match(/GRN-\d{6}-(\d{4})$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  // Format: GRN-YYYYMM-0001
  const sequence = String(nextNumber).padStart(4, '0');
  return `${prefix}-${sequence}`;
};

/**
 * Validate GR Number format
 */
export const validateGRNumberFormat = (grNumber) => {
  const regex = /^GRN-\d{6}-\d{4}$/;
  return regex.test(grNumber);
};


/**
 * Generate next GR Number (API endpoint)
 */
export const getNextGRNumber = async (req, res) => {
  try {
    const nextGRNumber = await generateGRNumber();
    
    const response = new ApiResponse({
      success: true,
      data: { nextNumber: nextGRNumber }
    });
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error generating GR number:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to generate GR number',
      details: error.message
    });
    res.status(500).json(response);
  }
};

/**
 * Create new Goods Receipt with QC functionality
 */
export const createGoodsReceipt = async (req, res) => {
  try {
    const {
      grNumber: providedGrNumber, // Optional: user can provide or let system generate
      receivedDate,
      vendorDeliveryNote,
      vehicleNumber,
      driverName,
      purchaseOrderId,
      warehouseId,
      receivedById,
      notes,
      items
    } = req.body;

    // Validate required fields (grNumber is now optional)
    const requiredFields = ['vendorDeliveryNote', 'purchaseOrderId', 'warehouseId', 'receivedById', 'items'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      const response = new ApiResponse({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
      return res.status(400).json(response);
    }

    // If user provides grNumber, validate the format
    if (providedGrNumber && !validateGRNumberFormat(providedGrNumber)) {
      const response = new ApiResponse({
        success: false,
        error: 'Invalid GR number format. Expected format: GRN-YYYYMM-0001'
      });
      return res.status(400).json(response);
    }

    // Validate purchase order exists
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { 
        lines: {
          include: {
            product: true
          }
        }
      }
    });

    if (!purchaseOrder) {
      const response = new ApiResponse({
        success: false,
        error: 'Purchase order not found'
      });
      return res.status(404).json(response);
    }

    // Validate warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId }
    });

    if (!warehouse) {
      const response = new ApiResponse({
        success: false,
        error: 'Warehouse not found'
      });
      return res.status(404).json(response);
    }

    // Validate receivedBy user exists
    const receivedBy = await prisma.user.findUnique({
      where: { id: receivedById }
    });

    if (!receivedBy) {
      const response = new ApiResponse({
        success: false,
        error: 'Receiver not found'
      });
      return res.status(404).json(response);
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      const response = new ApiResponse({
        success: false,
        error: 'Items must be a non-empty array'
      });
      return res.status(400).json(response);
    }

    // Start transaction for creating GR with QC
    const result = await prisma.$transaction(async (tx) => {
      // Generate or use provided GR number
      let grNumber = providedGrNumber;
      
      if (!grNumber) {
        // Auto-generate GR number inside transaction to prevent race condition
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `GRN-${year}${month}`;
        
        // Find the latest GR number for this month with row-level locking
        const latestGR = await tx.goodsReceipt.findFirst({
          where: {
            grNumber: {
              startsWith: prefix
            }
          },
          orderBy: {
            grNumber: 'desc'
          },
          select: {
            grNumber: true
          }
        });

        let nextNumber = 1;
        
        if (latestGR) {
          const match = latestGR.grNumber.match(/GRN-\d{6}-(\d{4})$/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }

        // Format: GRN-YYYYMM-0001
        const sequence = String(nextNumber).padStart(4, '0');
        grNumber = `${prefix}-${sequence}`;
      } else {
        // If user provided grNumber, check if it already exists
        const existingGR = await tx.goodsReceipt.findUnique({
          where: { grNumber }
        });

        if (existingGR) {
          throw new Error('GR number already exists');
        }
      }

      // Create Goods Receipt
      const goodsReceipt = await tx.goodsReceipt.create({
        data: {
          grNumber,
          receivedDate: receivedDate ? new Date(receivedDate) : null, // Only fill when material actually arrives
          expectedDate: purchaseOrder.expectedDeliveryDate ? new Date(purchaseOrder.expectedDeliveryDate) : null, // From PO's expected delivery
          vendorDeliveryNote,
          vehicleNumber,
          driverName,
          purchaseOrderId,
          warehouseId,
          receivedById,
          notes,
          status: 'COMPLETED'
        }
      });

      // Process each item with QC
      const createdItems = [];
      
      for (const item of items) {
        const {
          productId,
          qtyReceived,
          unit,
          purchaseOrderLineId,
          purchaseRequestDetailId,
          qtyPassed,
          qtyRejected = 0,
          qcStatus = 'PENDING',
          qcNotes
        } = item;

        // Validate product exists
        const product = await tx.product.findUnique({
          where: { id: productId }
        });

        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        // Validate quantities
        const receivedQty = parseFloat(qtyReceived);
        const passedQty = qtyPassed ? parseFloat(qtyPassed) : receivedQty;
        const rejectedQty = parseFloat(qtyRejected);

        if (passedQty + rejectedQty !== receivedQty) {
          throw new Error(`For product ${product.name}, qtyPassed + qtyRejected must equal qtyReceived`);
        }

        // Determine item status based on QC
        let itemStatus = 'RECEIVED';
        if (rejectedQty > 0 && passedQty > 0) {
          itemStatus = 'PARTIAL';
        } else if (rejectedQty === receivedQty) {
          itemStatus = 'REJECTED';
        }

        // Determine QC status if not provided
        let finalQcStatus = qcStatus;
        if (!qcStatus) {
          if (rejectedQty === 0) {
            finalQcStatus = 'PASSED';
          } else if (passedQty === 0) {
            finalQcStatus = 'REJECTED';
          } else {
            finalQcStatus = 'PARTIAL';
          }
        }

        // Create StockDetail only for passed quantity
        let stockDetail = null;
        if (passedQty > 0) {
          stockDetail = await tx.stockDetail.create({
            data: {
              productId,
              warehouseId,
              quantity: passedQty,
              unitPrice: 0, // Should be obtained from PO or average cost
              totalValue: 0,
              batchNumber: grNumber,
              transactionType: 'PURCHASE_RECEIPT',
              transactionDate: new Date(),
              referenceId: goodsReceipt.id,
              referenceType: 'GOODS_RECEIPT',
              status: 'AVAILABLE',
              qcStatus: finalQcStatus,
              notes: qcNotes
            }
          });
        }

        // Create GoodsReceiptItem
        const grItem = await tx.goodsReceiptItem.create({
          data: {
            goodsReceiptId: goodsReceipt.id,
            productId,
            qtyReceived: receivedQty,
            unit,
            qtyPassed: passedQty,
            qtyRejected: rejectedQty,
            status: itemStatus,
            qcStatus: finalQcStatus,
            qcNotes,
            purchaseOrderLineId,
            purchaseRequestDetailId,
            stockDetailId: stockDetail?.id || null
          }
        });

        createdItems.push(grItem);

        // Update product stock only for passed quantity
        if (passedQty > 0) {
          await tx.product.update({
            where: { id: productId },
            data: {
              stockQuantity: {
                increment: passedQty
              }
            }
          });
        }

        // Update PO line if exists
        if (purchaseOrderLineId) {
          await tx.purchaseOrderLine.update({
            where: { id: purchaseOrderLineId },
            data: {
              receivedQuantity: {
                increment: passedQty
              },
              rejectedQuantity: {
                increment: rejectedQty
              }
            }
          });
        }
      }

      // Update document status based on QC results
      const allItems = await tx.goodsReceiptItem.findMany({
        where: { goodsReceiptId: goodsReceipt.id }
      });

      const hasPendingQC = allItems.some(item => item.qcStatus === 'PENDING');
      const hasRejectedItems = allItems.some(item => item.qcStatus === 'REJECTED' || item.qcStatus === 'PARTIAL');

      let documentStatus = 'COMPLETED';
      if (hasPendingQC) {
        documentStatus = 'DRAFT';
      }

      await tx.goodsReceipt.update({
        where: { id: goodsReceipt.id },
        data: { status: documentStatus }
      });

      return { goodsReceipt: { ...goodsReceipt, status: documentStatus }, items: createdItems };
    });

    // Fetch complete GR with relations
    const completeGR = await prisma.goodsReceipt.findUnique({
      where: { id: result.goodsReceipt.id },
      include: {
        PurchaseOrder: {
          include: {
            supplier: true
          }
        },
        Warehouse: true,
        receivedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: true,
            stockDetail: true
          }
        }
      }
    });

    const response = new ApiResponse({
      success: true,
      data: completeGR,
      message: 'Goods receipt created successfully'
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating goods receipt:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to create goods receipt',
      details: error.message
    });
    res.status(500).json(response);
  }
};

/**
 * Create Goods Receipt automatically from Purchase Order
 * This is used when PO status changes to SENT
 */
export const createGoodsReceiptFromPO = async (req, res) => {
  try {
    const { poId } = req.params;
    const { receivedById } = req.body;

    // Validate required fields
    if (!poId) {
      const response = new ApiResponse({
        success: false,
        error: 'Purchase Order ID is required'
      });
      return res.status(400).json(response);
    }

    // Fetch PO data first to get fallback for receivedById
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        lines: {
          include: {
            product: true,
            prDetail: {
              select: {
                id: true,
                sourceProduct: true
              }
            }
          }
        }
      }
    });

    if (!purchaseOrder) {
      const response = new ApiResponse({
        success: false,
        error: 'Purchase order not found'
      });
      return res.status(404).json(response);
    }

    // ✅ NEW VALIDATION: Check if all items are services (JASA_PEMBELIAN)
    // Check both prDetail.sourceProduct and notGr flag
    // If all items are services, don't create GR (services don't need goods receipt)
    const allItemsAreServices = purchaseOrder.lines.every(line => 
      line.notGr === true || line.prDetail?.sourceProduct === 'JASA_PEMBELIAN'
    );

    if (allItemsAreServices) {
      const response = new ApiResponse({
        success: false,
        error: 'Goods Receipt tidak diperlukan untuk PO yang hanya berisi Jasa/Services (JASA_PEMBELIAN)',
        message: 'This PO contains only service items (JASA_PEMBELIAN). Goods Receipt is not applicable for services.'
      });
      return res.status(400).json(response);
    }

    // Determine receiver ID (Use provided ID or default to PO creator)
    const finalReceivedById = receivedById || purchaseOrder.orderedById;

    if (!finalReceivedById) {
      const response = new ApiResponse({
        success: false,
        error: 'Receiver ID is required and could not be determined from PO'
      });
      return res.status(400).json(response);
    }

    // Validate PO has required data
    if (!purchaseOrder.warehouseId) {
      const response = new ApiResponse({
        success: false,
        error: 'Purchase Order must have a warehouse assigned'
      });
      return res.status(400).json(response);
    }

    if (!purchaseOrder.lines || purchaseOrder.lines.length === 0) {
      const response = new ApiResponse({
        success: false,
        error: 'Purchase Order must have at least one line item'
      });
      return res.status(400).json(response);
    }

    // Validate receivedBy: Frontend sends Karyawan ID, we need to get the User ID
    const karyawan = await prisma.karyawan.findUnique({
      where: { id: finalReceivedById },
      include: { user: true }
    });

    if (!karyawan) {
      const response = new ApiResponse({
        success: false,
        error: 'Karyawan (Receiver) not found'
      });
      return res.status(404).json(response);
    }

    if (!karyawan.userId || !karyawan.user) {
      // Fallback: If Karyawan has no user, check if the ID itself is a User ID
      const userExists = await prisma.user.findUnique({ where: { id: finalReceivedById } });
      
      if (!userExists) {
        const response = new ApiResponse({
          success: false,
          error: 'Receiver must have an associated user account'
        });
        return res.status(400).json(response);
      }
      // It was a User ID
    }

    const actualUserId = karyawan.userId || finalReceivedById;

    // Calculate remaining items (exclude service items with notGr=true)
    const pendingLines = purchaseOrder.lines
        .filter(line => line.notGr !== true) // Exclude service items
        .map(line => {
            const quantity = parseFloat(line.quantity) || 0;
            const receivedQty = parseFloat(line.receivedQuantity) || 0;
            const remainingQty = quantity - receivedQty;
            
            return {
                ...line,
                remainingQty
            };
        })
        .filter(line => line.remainingQty > 0);

    if (pendingLines.length === 0) {
        const response = new ApiResponse({
            success: false,
            error: 'All items in this Purchase Order have been fully received or are service items (no GR required).'
        });
        return res.status(400).json(response);
    }

    // Check for existing DRAFT GR
    const existingDraftGR = await prisma.goodsReceipt.findFirst({
      where: {
        purchaseOrderId: poId,
        status: 'DRAFT'
      },
      include: {
        items: true
      }
    });

    if (existingDraftGR) {
      // Logic for existing Draft GR: Add missing items
      const existingItemPOIds = new Set(existingDraftGR.items.map(i => i.purchaseOrderLineId));
      
      const newItemsToAdd = pendingLines.filter(line => !existingItemPOIds.has(line.id));

      if (newItemsToAdd.length > 0) {
        await prisma.$transaction(async (tx) => {
            for (const line of newItemsToAdd) {
                await tx.goodsReceiptItem.create({
                    data: {
                        goodsReceiptId: existingDraftGR.id,
                        productId: line.productId,
                        qtyPlanReceived: line.remainingQty,
                        qtyReceived: 0,
                        unit: line.product?.purchaseUnit || line.product?.unit || 'PCS',
                        qtyPassed: 0,
                        qtyRejected: 0,
                        status: 'RECEIVED', // Initial status
                        qcStatus: 'PENDING',
                        qcNotes: '',
                        purchaseOrderLineId: line.id,
                        stockDetailId: null
                    }
                });
            }
        });

         const response = new ApiResponse({
            success: true,
            data: existingDraftGR,
            message: `Updated existing Draft GR ${existingDraftGR.grNumber} with ${newItemsToAdd.length} new items.`
        });
        return res.status(200).json(response);
      } else {
         const response = new ApiResponse({
            success: true,
            data: existingDraftGR,
            message: `Existing Draft GR ${existingDraftGR.grNumber} is already up to date.`
        });
        return res.status(200).json(response);
      }
    }

    // Prepare GR data (New GR)
    const grData = {
      vendorDeliveryNote: '', // Empty, will be filled when supplier delivers
      vehicleNumber: '',
      driverName: '',
      purchaseOrderId: purchaseOrder.id,
      warehouseId: purchaseOrder.warehouseId,
      receivedById: actualUserId, // Use the User ID
      notes: `Auto-generated from PO ${purchaseOrder.poNumber}`,
      items: pendingLines.map(line => ({
        productId: line.productId,
        qtyPlanReceived: line.remainingQty, // Only plannes for what is remaining
        qtyReceived: 0, // Set to 0 - goods haven't arrived yet, just creating document
        unit: line.product?.purchaseUnit || line.product?.unit || 'PCS',
        qtyPassed: 0, // Set to 0 - will be filled when goods actually arrive
        qtyRejected: 0,
        qcStatus: 'PENDING',
        qcNotes: '',
        purchaseOrderLineId: line.id
      }))
    };

    // Start transaction for creating new GR
    const result = await prisma.$transaction(async (tx) => {
      // Auto-generate GR number inside transaction
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `GRN-${year}${month}`;
      
      const latestGR = await tx.goodsReceipt.findFirst({
        where: {
          grNumber: {
            startsWith: prefix
          }
        },
        orderBy: {
          grNumber: 'desc'
        },
        select: {
          grNumber: true
        }
      });

      let nextNumber = 1;
      
      if (latestGR) {
        const match = latestGR.grNumber.match(/GRN-\d{6}-(\d{4})$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const sequence = String(nextNumber).padStart(4, '0');
      const grNumber = `${prefix}-${sequence}`;

      // Create Goods Receipt
      const goodsReceipt = await tx.goodsReceipt.create({
        data: {
          grNumber,
          receivedDate: null, // Only fill when material actually arrives
          expectedDate: purchaseOrder.expectedDeliveryDate ? new Date(purchaseOrder.expectedDeliveryDate) : null, // From PO's expected delivery
          vendorDeliveryNote: grData.vendorDeliveryNote,
          vehicleNumber: grData.vehicleNumber,
          driverName: grData.driverName,
          purchaseOrderId: grData.purchaseOrderId,
          warehouseId: grData.warehouseId,
          receivedById: grData.receivedById,
          notes: grData.notes,
          status: 'DRAFT' // Auto-created GR starts as DRAFT, needs QC approval
        }
      });

      // Process each item
      const createdItems = [];
      
      for (const item of grData.items) {
        // Create GoodsReceiptItem
        const grItem = await tx.goodsReceiptItem.create({
          data: {
            goodsReceiptId: goodsReceipt.id,
            productId: item.productId,
            qtyPlanReceived: item.qtyPlanReceived || 0, // Add planned quantity from PO
            qtyReceived: item.qtyReceived,
            unit: item.unit,
            qtyPassed: item.qtyPassed,
            qtyRejected: item.qtyRejected,
            status: 'RECEIVED',
            qcStatus: item.qcStatus,
            qcNotes: item.qcNotes,
            purchaseOrderLineId: item.purchaseOrderLineId,
            stockDetailId: null
          }
        });

        createdItems.push(grItem);
      }

      return { goodsReceipt, items: createdItems };
    });

    // Fetch complete GR with relations
    const completeGR = await prisma.goodsReceipt.findUnique({
      where: { id: result.goodsReceipt.id },
      include: {
        PurchaseOrder: {
          include: {
            supplier: true
          }
        },
        Warehouse: true,
        items: {
          include: {
            product: true,
            stockDetail: true
          }
        }
      }
    });

    const response = new ApiResponse({
      success: true,
      data: completeGR,
      message: 'Goods receipt created successfully from PO'
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating goods receipt from PO:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to create goods receipt from PO',
      details: error.message
    });
    res.status(500).json(response);
  }
};

/**
 * Update QC Status for Goods Receipt Items
 */
export const updateQCStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    // Validate input
    if (!Array.isArray(items) || items.length === 0) {
      const response = new ApiResponse({
        success: false,
        error: 'Items array is required'
      });
      return res.status(400).json(response);
    }

    // Check if GR exists
    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!goodsReceipt) {
      const response = new ApiResponse({
        success: false,
        error: 'Goods receipt not found'
      });
      return res.status(404).json(response);
    }

    // Check if GR is cancellable
    if (goodsReceipt.status === 'CANCELLED') {
      const response = new ApiResponse({
        success: false,
        error: 'Cannot update QC status for cancelled goods receipt'
      });
      return res.status(400).json(response);
    }

    // Start transaction for QC update
    const result = await prisma.$transaction(async (tx) => {
      const updatedItems = [];

      for (const itemUpdate of items) {
        const {
          itemId,
          qcStatus,
          qtyPassed,
          qtyRejected,
          qcNotes
        } = itemUpdate;

        // Find the item
        const item = await tx.goodsReceiptItem.findUnique({
          where: { id: itemId },
          include: {
            stockDetail: true,
            product: true
          }
        });

        if (!item || item.goodsReceiptId !== id) {
          throw new Error(`Item ${itemId} not found in this goods receipt`);
        }

        // Calculate quantities
        const receivedQty = parseFloat(item.qtyReceived);
        let newQtyPassed = item.qtyPassed;
        let newQtyRejected = item.qtyRejected;

        if (qtyPassed !== undefined && qtyRejected !== undefined) {
          newQtyPassed = parseFloat(qtyPassed);
          newQtyRejected = parseFloat(qtyRejected);
          
          if (newQtyPassed + newQtyRejected !== receivedQty) {
            throw new Error(`qtyPassed + qtyRejected must equal qtyReceived (${receivedQty})`);
          }
        }

        // Determine item status
        let itemStatus = 'RECEIVED';
        if (newQtyRejected > 0 && newQtyPassed > 0) {
          itemStatus = 'PARTIAL';
        } else if (newQtyRejected === receivedQty) {
          itemStatus = 'REJECTED';
        }

        // Update or create StockDetail
        let stockDetail = item.stockDetail;
        
        if (newQtyPassed > 0) {
          if (stockDetail) {
            // Calculate stock difference
            const stockDiff = newQtyPassed - parseFloat(item.qtyPassed);
            
            // Update existing stock detail
            stockDetail = await tx.stockDetail.update({
              where: { id: stockDetail.id },
              data: {
                quantity: newQtyPassed,
                qcStatus,
                notes: qcNotes
              }
            });

            // Update product stock
            if (stockDiff !== 0) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stockQuantity: {
                    increment: stockDiff
                  }
                }
              });
            }
          } else {
            // Create new stock detail
            stockDetail = await tx.stockDetail.create({
              data: {
                productId: item.productId,
                warehouseId: goodsReceipt.warehouseId,
                quantity: newQtyPassed,
                unitPrice: 0,
                totalValue: 0,
                batchNumber: goodsReceipt.grNumber,
                transactionType: 'PURCHASE_RECEIPT',
                transactionDate: new Date(),
                referenceId: goodsReceipt.id,
                referenceType: 'GOODS_RECEIPT',
                status: 'AVAILABLE',
                qcStatus,
                notes: qcNotes
              }
            });

            // Update product stock
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  increment: newQtyPassed
                }
              }
            });
          }
        } else if (stockDetail) {
          // Remove stock if all rejected
          const stockToRemove = parseFloat(item.qtyPassed);
          
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: stockToRemove
              }
            }
          });

          await tx.stockDetail.delete({
            where: { id: stockDetail.id }
          });
          stockDetail = null;
        }

        // Update GoodsReceiptItem
        const updatedItem = await tx.goodsReceiptItem.update({
          where: { id: itemId },
          data: {
            qtyPassed: newQtyPassed,
            qtyRejected: newQtyRejected,
            status: itemStatus,
            qcStatus: qcStatus || item.qcStatus,
            qcNotes: qcNotes !== undefined ? qcNotes : item.qcNotes,
            stockDetailId: stockDetail?.id || null
          }
        });

        updatedItems.push(updatedItem);

        // Update PO line if exists
        if (item.purchaseOrderLineId) {
          const stockDiff = newQtyPassed - parseFloat(item.qtyPassed);
          const rejectDiff = newQtyRejected - parseFloat(item.qtyRejected);

          if (stockDiff !== 0 || rejectDiff !== 0) {
            await tx.purchaseOrderLine.update({
              where: { id: item.purchaseOrderLineId },
              data: {
                receivedQuantity: {
                  increment: stockDiff
                },
                rejectedQuantity: {
                  increment: rejectDiff
                }
              }
            });
          }
        }
      }

      // Update GR document status
      const allItems = await tx.goodsReceiptItem.findMany({
        where: { goodsReceiptId: id }
      });

      const hasPendingQC = allItems.some(item => item.qcStatus === 'PENDING');
      const newStatus = hasPendingQC ? 'DRAFT' : 'COMPLETED';

      await tx.goodsReceipt.update({
        where: { id },
        data: { status: newStatus }
      });

      return { updatedItems, status: newStatus };
    });

    // Fetch complete updated GR
    const completeGR = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            stockDetail: true
          }
        }
      }
    });

    const response = new ApiResponse({
      success: true,
      data: completeGR,
      message: 'QC status updated successfully'
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating QC status:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to update QC status',
      details: error.message
    });
    res.status(500).json(response);
  }
};

/**
 * Update Goods Receipt basic information
 */
export const updateGoodsReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if GR exists
    const existingGR = await prisma.goodsReceipt.findUnique({
      where: { id }
    });

    if (!existingGR) {
      const response = new ApiResponse({
        success: false,
        error: 'Goods receipt not found'
      });
      return res.status(404).json(response);
    }

    // Prevent updates if GR is completed or cancelled
    if (existingGR.status !== 'DRAFT') {
      const response = new ApiResponse({
        success: false,
        error: 'Can only update goods receipt in DRAFT status'
      });
      return res.status(400).json(response);
    }

    // Handle GR number update
    if (updates.grNumber && updates.grNumber !== existingGR.grNumber) {
      const grNumberExists = await prisma.goodsReceipt.findUnique({
        where: { grNumber: updates.grNumber }
      });

      if (grNumberExists) {
        const response = new ApiResponse({
          success: false,
          error: 'GR number already exists'
        });
        return res.status(409).json(response);
      }
    }

    // Update GR
    const updatedGR = await prisma.goodsReceipt.update({
      where: { id },
      data: {
        grNumber: updates.grNumber,
        receivedDate: updates.receivedDate ? new Date(updates.receivedDate) : undefined,
        vendorDeliveryNote: updates.vendorDeliveryNote,
        vehicleNumber: updates.vehicleNumber,
        driverName: updates.driverName,
        purchaseOrderId: updates.purchaseOrderId,
        warehouseId: updates.warehouseId,
        notes: updates.notes,
        status: updates.status
      },
      include: {
        PurchaseOrder: true,
        Warehouse: true,
        receivedBy: true
      }
    });

    const response = new ApiResponse({
      success: true,
      data: updatedGR,
      message: 'Goods receipt updated successfully'
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating goods receipt:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to update goods receipt',
      details: error.message
    });
    res.status(500).json(response);
  }
};

/**
 * Delete Goods Receipt
 */
export const deleteGoodsReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if GR exists
    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            stockDetail: true
          }
        }
      }
    });

    if (!goodsReceipt) {
      const response = new ApiResponse({
        success: false,
        error: 'Goods receipt not found'
      });
      return res.status(404).json(response);
    }

    // Check if GR can be deleted
    if (goodsReceipt.status !== 'DRAFT') {
      const response = new ApiResponse({
        success: false,
        error: 'Can only delete goods receipt in DRAFT status'
      });
      return res.status(400).json(response);
    }

    // Start transaction for deletion
    await prisma.$transaction(async (tx) => {
      // Reverse stock adjustments and delete stock details
      for (const item of goodsReceipt.items) {
        if (item.stockDetail) {
          // Reverse product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: parseFloat(item.qtyPassed)
              }
            }
          });

          // Delete stock detail
          await tx.stockDetail.delete({
            where: { id: item.stockDetail.id }
          });
        }

        // Reverse PO line updates
        if (item.purchaseOrderLineId) {
          await tx.purchaseOrderLine.update({
            where: { id: item.purchaseOrderLineId },
            data: {
              receivedQuantity: {
                decrement: parseFloat(item.qtyPassed)
              }
            }
          });
        }
      }

      // Delete GR items
      await tx.goodsReceiptItem.deleteMany({
        where: { goodsReceiptId: id }
      });

      // Delete GR
      await tx.goodsReceipt.delete({
        where: { id }
      });
    });

    const response = new ApiResponse({
      success: true,
      message: 'Goods receipt deleted successfully'
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting goods receipt:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to delete goods receipt',
      details: error.message
    });
    res.status(500).json(response);
  }
};

/**
 * Get Goods Receipts by Purchase Order ID
 */
export const getGoodsReceiptsByPurchaseOrder = async (req, res) => {
  try {
    const { purchaseOrderId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const where = { purchaseOrderId };

    const totalCount = await prisma.goodsReceipt.count({ where });

    const goodsReceipts = await prisma.goodsReceipt.findMany({
      where,
      include: {
        Warehouse: true,
        receivedBy: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        receivedDate: 'desc'
      },
      skip,
      take: pageSize
    });

    // Calculate QC summary for this PO
    const qcSummary = await prisma.goodsReceiptItem.aggregate({
      where: {
        goodsReceipt: where
      },
      _sum: {
        qtyReceived: true,
        qtyPassed: true,
        qtyRejected: true
      }
    });

    const paginationMeta = {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: pageNumber,
      pageSize,
      hasNext: pageNumber < Math.ceil(totalCount / pageSize),
      hasPrev: pageNumber > 1
    };

    const response = new ApiResponse({
      success: true,
      data: new ListResponse({
        data: goodsReceipts,
        pagination: paginationMeta,
        summary: {
          totalReceived: qcSummary._sum.qtyReceived || 0,
          totalPassed: qcSummary._sum.qtyPassed || 0,
          totalRejected: qcSummary._sum.qtyRejected || 0,
          passingRate: qcSummary._sum.qtyReceived 
            ? ((qcSummary._sum.qtyPassed || 0) / qcSummary._sum.qtyReceived * 100).toFixed(2)
            : 0
        }
      })
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching GR by PO:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to fetch goods receipts',
      details: error.message
    });
    res.status(500).json(response);
  }
};

/**
 * Validate GR Number availability
 */
export const validateGrNumber = async (req, res) => {
  try {
    const { grNumber } = req.params;

    const existingGR = await prisma.goodsReceipt.findUnique({
      where: { grNumber }
    });

    const response = new ApiResponse({
      success: true,
      data: {
        available: !existingGR,
        grNumber
      }
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error validating GR number:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to validate GR number',
      details: error.message
    });
    res.status(500).json(response);
  }
};

/**
 * Get GR summary statistics
 */
export const getGoodsReceiptSummary = async (req, res) => {
  try {
    const { startDate, endDate, warehouseId, vendorId } = req.query;

    const where = {};

    if (startDate || endDate) {
      where.receivedDate = {};
      if (startDate) {
        where.receivedDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.receivedDate.lte = new Date(endDate);
      }
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (vendorId) {
      where.purchaseOrder = {
        vendorId: vendorId
      };
    }

    // Get counts by status
    const statusCounts = await prisma.goodsReceipt.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    });

    // Get QC statistics
    const qcStats = await prisma.goodsReceiptItem.aggregate({
      where: {
        goodsReceipt: where
      },
      _sum: {
        qtyReceived: true,
        qtyPassed: true,
        qtyRejected: true
      },
      _count: {
        id: true
      }
    });

    // Get recent GRs
    const recentReceipts = await prisma.goodsReceipt.findMany({
      where,
      include: {
        Warehouse: true,
        PurchaseOrder: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: {
        receivedDate: 'desc'
      },
      take: 10
    });

    // Get monthly statistics
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const monthlyStats = await prisma.goodsReceipt.aggregate({
      where: {
        ...where,
        receivedDate: {
          gte: startOfMonth
        }
      },
      _count: {
        id: true
      }
    });

    // Get top products by rejection rate
    const topRejectedProducts = await prisma.goodsReceiptItem.groupBy({
      by: ['productId'],
      where: {
        goodsReceipt: where,
        qtyRejected: {
          gt: 0
        }
      },
      _sum: {
        qtyReceived: true,
        qtyRejected: true
      },
      orderBy: {
        _sum: {
          qtyRejected: 'desc'
        }
      },
      take: 5
    });

    // Fetch product names for top rejected products
    const topRejectedWithNames = await Promise.all(
      topRejectedProducts.map(async (product) => {
        const productInfo = await prisma.product.findUnique({
          where: { id: product.productId },
          select: { name: true, code: true }
        });
        return {
          productId: product.productId,
          productName: productInfo?.name || 'Unknown',
          productCode: productInfo?.code || 'N/A',
          totalReceived: product._sum.qtyReceived || 0,
          totalRejected: product._sum.qtyRejected || 0,
          rejectionRate: product._sum.qtyReceived 
            ? ((product._sum.qtyRejected || 0) / product._sum.qtyReceived * 100).toFixed(2)
            : 0
        };
      })
    );

    const response = new ApiResponse({
      success: true,
      data: {
        statusCounts,
        qcStats: {
          totalItems: qcStats._count.id,
          totalReceived: qcStats._sum.qtyReceived || 0,
          totalPassed: qcStats._sum.qtyPassed || 0,
          totalRejected: qcStats._sum.qtyRejected || 0,
          passingRate: qcStats._sum.qtyReceived 
            ? ((qcStats._sum.qtyPassed || 0) / qcStats._sum.qtyReceived * 100).toFixed(2)
            : 0
        },
        recentReceipts,
        monthlyTotal: monthlyStats._count.id,
        totalGRs: statusCounts.reduce((sum, item) => sum + item._count.id, 0),
        topRejectedProducts: topRejectedWithNames
      }
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching GR summary:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to fetch summary',
      details: error.message
    });
    res.status(500).json(response);
  }
};

/**
 * Get items pending QC inspection
 */
export const getPendingQCItems = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const pendingItems = await prisma.goodsReceiptItem.findMany({
      where: {
        qcStatus: 'PENDING'
      },
      include: {
        goodsReceipt: {
          include: {
            PurchaseOrder: {
              include: {
                supplier: true
              }
            },
            Warehouse: true
          }
        },
        product: true
      },
      orderBy: {
        goodsReceipt: {
          receivedDate: 'asc'
        }
      },
      skip,
      take: pageSize
    });

    const totalCount = await prisma.goodsReceiptItem.count({
      where: {
        qcStatus: 'PENDING'
      }
    });

    const paginationMeta = {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: pageNumber,
      pageSize,
      hasNext: pageNumber < Math.ceil(totalCount / pageSize),
      hasPrev: pageNumber > 1
    };

    const response = new ApiResponse({
      success: true,
      data: new ListResponse({
        data: pendingItems,
        pagination: paginationMeta,
        summary: {
          totalPendingItems: totalCount
        }
      })
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching pending QC items:', error);
    const response = new ApiResponse({
      success: false,
      error: 'Failed to fetch pending QC items',
      details: error.message
    });
    res.status(500).json(response);
  }
};


/**
 * Mark goods as arrived - Update GR when physical goods arrive
 * PATCH /api/gr/:id/arrived
 */
export const markGoodsArrived = async (req, res) => {
  const { id } = req.params;
  const { receivedDate, vendorDeliveryNote, vehicleNumber, driverName, items } = req.body;

  try {
    // Validate GR exists and is in DRAFT status
    const existingGR = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingGR) {
      return res.status(404).json({
        success: false,
        error: 'Goods Receipt not found'
      });
    }

    if (existingGR.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: 'Can only mark DRAFT GRs as arrived'
      });
    }

    // Update GR in transaction
    const updatedGR = await prisma.$transaction(async (tx) => {
      // Update GR header - set status to ARRIVED
      const gr = await tx.goodsReceipt.update({
        where: { id },
        data: {
          receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
          vendorDeliveryNote: vendorDeliveryNote || '',
          vehicleNumber: vehicleNumber || null,
          driverName: driverName || null,
          status: 'ARRIVED' // Update GR status to ARRIVED
        }
      });

      // Update each item's qtyReceived and change status to ARRIVED
      for (const item of items) {
        const qtyReceived = parseFloat(item.qtyReceived);
        
        // Find the item to get qtyPlanReceived
        const existingItem = existingGR.items.find(i => i.id === item.id);
        const qtyPlan = existingItem?.qtyPlanReceived || 0;
        
        // Determine item status based on received vs planned
        let itemStatus = 'RECEIVED';
        if (qtyReceived < qtyPlan) {
          itemStatus = 'PARTIAL';
        }
        
        await tx.goodsReceiptItem.update({
          where: { id: item.id },
          data: {
            qtyReceived: qtyReceived,
            qcStatus: 'ARRIVED',
            status: itemStatus // Update item status to RECEIVED or PARTIAL
          }
        });
      }

      // Return updated GR with relations
      return await tx.goodsReceipt.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true
            }
          },
          PurchaseOrder: {
            include: {
              supplier: true
            }
          },
          Warehouse: true
        }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Goods marked as arrived successfully',
      data: updatedGR
    });
  } catch (error) {
    console.error('Error marking goods as arrived:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark goods as arrived',
      details: error.message
    });
  }
};

/**
 * Record QC Check results
 * PATCH /api/gr/:id/qc-check
 */
export const recordQCCheck = async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  try {
    // Validate GR exists
    const existingGR = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingGR) {
      return res.status(404).json({
        success: false,
        error: 'Goods Receipt not found'
      });
    }

    if (existingGR.status !== 'DRAFT' && existingGR.status !== 'ARRIVED') {
      return res.status(400).json({
        success: false,
        error: 'Can only perform QC check on DRAFT or ARRIVED GRs'
      });
    }

    // Update items in transaction
    const updatedGR = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        // Get current item to validate
        const currentItem = existingGR.items.find(i => i.id === item.id);
        if (!currentItem) {
          throw new Error(`Item ${item.id} not found in GR`);
        }

        const qtyPassed = parseFloat(item.qtyPassed);
        const qtyRejected = parseFloat(item.qtyRejected);
        const qtyReceived = parseFloat(currentItem.qtyReceived);

        // Validate: qtyPassed + qtyRejected must equal qtyReceived
        if (Math.abs((qtyPassed + qtyRejected) - qtyReceived) > 0.0001) {
          throw new Error(
            `Item ${currentItem.product?.name || item.id}: qtyPassed (${qtyPassed}) + qtyRejected (${qtyRejected}) must equal qtyReceived (${qtyReceived})`
          );
        }

        // Auto-determine QC status
        let qcStatus;
        if (qtyRejected === 0) {
          qcStatus = 'PASSED';
        } else if (qtyPassed === 0) {
          qcStatus = 'REJECTED';
        } else {
          qcStatus = 'PARTIAL';
        }

        // Update item
        await tx.goodsReceiptItem.update({
          where: { id: item.id },
          data: {
            qtyPassed,
            qtyRejected,
            qcStatus,
            qcNotes: item.qcNotes || null
          }
        });
      }

      // Update GR status to PASSED after QC completion
      await tx.goodsReceipt.update({
        where: { id },
        data: {
          status: 'PASSED'
        }
      });

      // Return updated GR
      return await tx.goodsReceipt.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true
            }
          },
          PurchaseOrder: {
            include: {
              supplier: true
            }
          },
          Warehouse: true
        }
      });
    });

    res.status(200).json({
      success: true,
      message: 'QC check recorded successfully',
      data: updatedGR
    });
  } catch (error) {
    console.error('Error recording QC check:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to record QC check',
      details: error.message
    });
  }
};

/**
 * Approve GR and update stock balance
 * POST /api/gr/:id/approve
 */
export const approveGR = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  try {
    // Validate GR exists
    const existingGR = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            purchaseOrderLine: true,
            purchaseRequestDetail: true
          }
        },
        Warehouse: true,
        PurchaseOrder: {
          include: {
            SPK: true
          }
        }
      }
    });

    if (!existingGR) {
      return res.status(404).json({
        success: false,
        error: 'Goods Receipt not found'
      });
    }

    if (existingGR.status !== 'DRAFT' && existingGR.status !== 'PASSED') {
      return res.status(400).json({
        success: false,
        error: 'Can only approve DRAFT or PASSED GRs'
      });
    }

    // Validate all items have completed QC (not PENDING or ARRIVED)
    const pendingItems = existingGR.items.filter(
      item => item.qcStatus === 'PENDING' || item.qcStatus === 'ARRIVED'
    );

    if (pendingItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'All items must complete QC check before approval',
        details: `${pendingItems.length} items still pending QC`
      });
    }

    // Approve and update stock in transaction
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const currentPeriod = new Date(now.getFullYear(), now.getMonth(), 1);


      let totalInventoryValue = 0;

      // Process each item with qtyPassed > 0
      for (const item of existingGR.items) {
        const qtyPassed = parseFloat(item.qtyPassed);
        // FIX: For TRANSFER source type, allow 1:1 conversion (no conversion) regarding input qty vs stock qty
        // to prevent inflating stock when transferring between warehouses.
        const conversion = existingGR.sourceType === 'TRANSFER' 
            ? 1 
            : (parseFloat(item.product.conversionToStorage) || 1);
        const qtyConverted = qtyPassed * conversion;
        
        if (qtyPassed > 0) {
          // Get current stock balance to calculate snapshots
          const existingBalance = await tx.stockBalance.findFirst({
            where: {
              productId: item.productId,
              warehouseId: existingGR.warehouseId,
              period: currentPeriod
            }
          });

          const stockAwal = existingBalance ? parseFloat(existingBalance.stockAkhir) : 0;
          const stockAkhir = stockAwal + qtyConverted;
          
          // Logic penentuan harga: Prioritas 1. MR priceUnit (for transfers), 2. Transfer COGS, 3. PO Line, 4. PR Detail
          let price = 0;

          // For TRANSFER sourceType, try to get price from MR or Transfer
          if (existingGR.sourceType === 'TRANSFER' && existingGR.vendorDeliveryNote) {
            // Try to find MR linked to this transfer
            const transferNumber = existingGR.vendorDeliveryNote;
            const mr = await tx.materialRequisition.findFirst({
              where: {
                notes: { contains: `[${transferNumber}]` }
              },
              include: {
                items: {
                  where: { productId: item.productId },
                  select: {
                    priceUnit: true,
                    qtyIssued: true
                  }
                }
              }
            });

            if (mr && mr.items.length > 0) {
              const mrItem = mr.items[0];
              price = Number(mrItem.priceUnit || 0);
            } else {
              const stockTransfer = await tx.stockTransfer.findFirst({
                where: { transferNumber: transferNumber },
                include: {
                  items: {
                    where: { productId: item.productId },
                    select: {
                      quantity: true,
                      cogs: true
                    }
                  }
                }
              });

              if (stockTransfer && stockTransfer.items.length > 0) {
                const transferItem = stockTransfer.items[0];
                if (Number(transferItem.quantity) > 0) {
                  price = Number(transferItem.cogs || 0) / Number(transferItem.quantity);
                }
              }
            }
          }
          // For PO-based GRs, use PO Line or PR pricing
          else {
            if (item.purchaseOrderLine) {
               const actualPrice = parseFloat(item.purchaseOrderLine.unitPriceActual || 0);
               const standardPrice = parseFloat(item.purchaseOrderLine.unitPrice || 0);
               price = actualPrice !== 0 ? actualPrice : standardPrice;
            } else if (item.purchaseRequestDetail && item.purchaseRequestDetail.estimasiHargaSatuan) {
              price = parseFloat(item.purchaseRequestDetail.estimasiHargaSatuan);
            }
          }

          if (isNaN(price)) price = 0;

          const transactionValue = parseFloat(price) * parseFloat(qtyPassed);
          totalInventoryValue += transactionValue;

          const pricePerBaseUnit = existingGR.sourceType === 'TRANSFER' 
            ? price 
            : (qtyConverted > 0 ? transactionValue / qtyConverted : 0);

          const newStockDetail = await tx.stockDetail.create({
            data: {
              product: {
                connect: { id: item.productId }
              },
              warehouse: {
                connect: { id: existingGR.warehouseId }
              },
              stockAwalSnapshot: stockAwal,
              stockAkhirSnapshot: stockAkhir,
              transQty: qtyPassed,
              transUnit: item.unit,
              baseQty: qtyConverted,
              residualQty: qtyConverted,
              isFullyConsumed: false,
              type: 'IN',
              source: existingGR.sourceType || 'PO',
              pricePerUnit: pricePerBaseUnit,
              referenceNo: existingGR.grNumber,
              notes: `GR ${existingGR.grNumber} - QC Passed`
            }
          });

          // Update or create StockBalance
          const previousPeriod = new Date(currentPeriod);
          previousPeriod.setMonth(previousPeriod.getMonth() - 1);

          const previousBalance = await tx.stockBalance.findFirst({
            where: {
              productId: item.productId,
              warehouseId: existingGR.warehouseId,
              period: previousPeriod
            }
          });

          if (existingBalance) {
            const currentStockAkhir = parseFloat(existingBalance.stockAkhir) || 0;
            const currentBooked = parseFloat(existingBalance.bookedStock) || 0;
            const newStockAkhir = currentStockAkhir + qtyConverted;
            
            let newAvailable = newStockAkhir - currentBooked;
            if (newAvailable < 0) newAvailable = 0;

            await tx.stockBalance.update({
              where: { id: existingBalance.id },
              data: {
                stockIn: { increment: qtyConverted },
                stockAkhir: { set: newStockAkhir },
                bookedStock: { set: currentBooked },
                availableStock: { set: newAvailable },
                ...(existingGR.sourceType !== 'TRANSFER' && { onPR: { decrement: qtyConverted } }),
                inventoryValue: { increment: transactionValue }
              }
            });
          } else {
            const baseStockAwal = previousBalance ? parseFloat(previousBalance.stockAkhir) : 0;
            const baseBooked = previousBalance ? parseFloat(previousBalance.bookedStock) : 0;
            const baseOnPR = previousBalance ? parseFloat(previousBalance.onPR) : 0;
            const baseInventoryValue = previousBalance ? parseFloat(previousBalance.inventoryValue) : 0;
            
            const newStockAkhir = baseStockAwal + qtyConverted;
            let newAvailable = newStockAkhir - baseBooked;
            if (newAvailable < 0) newAvailable = 0;

            await tx.stockBalance.create({
              data: {
                productId: item.productId,
                warehouseId: existingGR.warehouseId,
                period: currentPeriod,
                stockAwal: baseStockAwal,
                stockIn: qtyConverted,
                stockOut: 0,
                stockAkhir: newStockAkhir, 
                bookedStock: baseBooked,
                availableStock: newAvailable,
                onPR: existingGR.sourceType !== 'TRANSFER' && baseOnPR > 0 ? (baseOnPR - qtyConverted < 0 ? 0 : baseOnPR - qtyConverted) : baseOnPR,
                inventoryValue: baseInventoryValue + transactionValue
              }
            });
          }

          await tx.goodsReceiptItem.update({
            where: { id: item.id },
            data: {
              stockDetail: {
                connect: { id: newStockDetail.id }
              }
            }
          });

          if (item.purchaseOrderLineId) {
            await tx.purchaseOrderLine.update({
              where: { id: item.purchaseOrderLineId },
              data: {
                receivedQuantity: { increment: qtyPassed }
              }
            });
          }
        }
      }

      // ========================================
      // ACCOUNTING LEDGER INTEGRATION
      // ========================================
      if (totalInventoryValue > 0) {
        const period = await getActivePeriod(now, tx);
        const ledgerNumber = await generateGRLedgerNumber(now, tx);

        // Get Accounts
        // Debit Account (Inventory)
        let debitAccount = null;
        // Priority 1: Warehouse specific inventory account
        if (existingGR.Warehouse?.inventoryAccountId) {
          debitAccount = await tx.chartOfAccounts.findUnique({
            where: { id: existingGR.Warehouse.inventoryAccountId }
          });
        }
        
        // Priority 2: System Account Mapping
        if (!debitAccount) {
          debitAccount = await getSystemAccount('INVENTORY_WIP', tx);
        }

        // Priority 3: Fallback by Code
        if (!debitAccount) {
          debitAccount = await getCOAByCode('1-10205', tx);
        }

        // Credit Account (Unbilled or Source Warehouse)
        let creditAccount = null;

        if (existingGR.sourceType === 'TRANSFER') {
          // Internal Transfer: Credit the SOURCE warehouse inventory account
          let fromWarehouseId = null;
          const transferNumber = existingGR.vendorDeliveryNote;

          if (transferNumber) {
            // Priority 1: Check StockTransfer model
            const stockTransfer = await tx.stockTransfer.findFirst({
              where: { transferNumber: transferNumber }
            });
            
            if (stockTransfer) {
              fromWarehouseId = stockTransfer.fromWarehouseId;
            } else {
              // Priority 2: Check MaterialRequisition (often used for MR-based transfers)
              const mr = await tx.materialRequisition.findFirst({
                where: { notes: { contains: `[${transferNumber}]` } }
              });
              if (mr) fromWarehouseId = mr.warehouseId;
            }
          }

          if (fromWarehouseId) {
            const fromWarehouse = await tx.warehouse.findUnique({
              where: { id: fromWarehouseId }
            });
            
            if (fromWarehouse?.inventoryAccountId) {
              creditAccount = await tx.chartOfAccounts.findUnique({
                where: { id: fromWarehouse.inventoryAccountId }
              });
            }
          }

          // Fallback for Transfer: System Mapping (INVENTORY_WIP)
          if (!creditAccount) {
            creditAccount = await getSystemAccount('INVENTORY_WIP', tx) || await getCOAByCode('1-10205', tx);
          }
        } else {
          // Regular Purchase: Credit Unbilled Receipt System Account
          // Priority 1: System Account Mapping
          creditAccount = await getSystemAccount('UNBILLED_RECEIPT', tx);

          // Priority 2: Fallback by Code
          if (!creditAccount) {
            creditAccount = await getCOAByCode('2-10102', tx);
          }
        }

        if (!debitAccount || !creditAccount) {
          console.warn('Accounting accounts for GR not found. Ledger entry skipped.');
        } else {
          // Create Ledger
          const ledger = await tx.ledger.create({
            data: {
              ledgerNumber: ledgerNumber,
              referenceNumber: existingGR.grNumber,
              referenceType: 'GOODS_RECEIPT',
              transactionDate: now,
              postingDate: new Date(),
              description: `Inventory Receipt: ${existingGR.grNumber} at ${existingGR.Warehouse?.name || 'Warehouse'}`,
              notes: notes || existingGR.notes,
              periodId: period.id,
              status: 'POSTED',
              currency: 'IDR',
              exchangeRate: 1.0,
              createdBy: existingGR.receivedById,
              postedBy: existingGR.receivedById,
              postedAt: new Date()
            }
          });

          // Create Ledger Lines
          const ledgerLines = [
            {
              ledgerId: ledger.id,
              coaId: debitAccount.id,
              debitAmount: totalInventoryValue,
              creditAmount: 0,
              currency: 'IDR',
              localAmount: totalInventoryValue,
              description: `Stock In: ${existingGR.grNumber}`,
              lineNumber: 1,
              salesOrderId: existingGR.PurchaseOrder?.SPK?.salesOrderId || null
            },
            {
              ledgerId: ledger.id,
              coaId: creditAccount.id,
              debitAmount: 0,
              creditAmount: totalInventoryValue,
              currency: 'IDR',
              localAmount: totalInventoryValue,
              description: `Unbilled Receipt: ${existingGR.grNumber}`,
              lineNumber: 2,
              salesOrderId: existingGR.PurchaseOrder?.SPK?.salesOrderId || null
            }
          ];

          await tx.ledgerLine.createMany({
            data: ledgerLines
          });

          // Update Financial Summaries
          for (const line of ledgerLines) {
            await updateTrialBalance({
              periodId: period.id,
              coaId: line.coaId,
              debitAmount: line.debitAmount,
              creditAmount: line.creditAmount,
              tx
            });

            await updateGeneralLedgerSummary({
              coaId: line.coaId,
              periodId: period.id,
              date: now,
              debitAmount: line.debitAmount,
              creditAmount: line.creditAmount,
              tx
            });
          }
          console.log(`✅ Accounting entry created for GR ${existingGR.grNumber}. Total: ${totalInventoryValue}`);
        }
      }

      // Update GR status to COMPLETED
      const updatedGR = await tx.goodsReceipt.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          notes: notes || existingGR.notes
        },
        include: {
          items: {
            include: {
              product: true,
              stockDetail: true
            }
          },
          PurchaseOrder: {
            include: {
              supplier: true
            }
          },
          Warehouse: true
        }
      });

      // Update StockTransfer status to RECEIVED if this is a transfer GR
      if (existingGR.sourceType === 'TRANSFER' && existingGR.vendorDeliveryNote) {
        await tx.stockTransfer.updateMany({
          where: {
            transferNumber: existingGR.vendorDeliveryNote,
            status: 'IN_TRANSIT'
          },
          data: {
            status: 'RECEIVED'
          }
        });
      }

      // Update Purchase Order Status
      if (existingGR.purchaseOrderId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: existingGR.purchaseOrderId },
          include: { lines: true }
        });

        if (po) {
          const totalOrdered = po.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
          const totalReceived = po.lines.reduce((sum, line) => sum + Number(line.receivedQuantity || 0), 0);
          
          let newPoStatus = po.status;
          if (totalReceived >= totalOrdered && totalOrdered > 0) {
            newPoStatus = 'FULLY_RECEIVED';
          } else if (totalReceived > 0) {
            newPoStatus = 'PARTIALLY_RECEIVED';
          }
          
          if (newPoStatus !== po.status && !['CANCELLED', 'REJECTED'].includes(po.status)) {
             await tx.purchaseOrder.update({
               where: { id: po.id },
               data: { status: newPoStatus }
             });
          }
        }
      }

      // AUTO-CREATE GR FOR REMAINING
      const itemsWithRemaining = existingGR.items.filter(item => {
        const qtyReceived = parseFloat(item.qtyReceived || 0);
        const qtyPlan = parseFloat(item.qtyPlanReceived || 0);
        return qtyReceived < qtyPlan && qtyPlan > 0;
      });

      let autoCreatedGR = null;
      if (itemsWithRemaining.length > 0 && existingGR.purchaseOrderId) {
        const newGRNumber = await generateGRNumberWithinTx(tx);

        autoCreatedGR = await tx.goodsReceipt.create({
          data: {
            grNumber: newGRNumber,
            purchaseOrderId: existingGR.purchaseOrderId,
            warehouseId: existingGR.warehouseId,
            receivedById: existingGR.receivedById,
            sourceType: existingGR.sourceType || 'PO',
            status: 'DRAFT',
            expectedDate: existingGR.expectedDate,
            vendorDeliveryNote: `Auto-created from ${existingGR.grNumber}`,
            notes: `Auto-created from ${existingGR.grNumber} for remaining quantities`,
            items: {
              create: itemsWithRemaining.map(item => {
                const remainingQty = parseFloat(item.qtyPlanReceived) - parseFloat(item.qtyReceived);
                return {
                  productId: item.productId,
                  qtyPlanReceived: remainingQty,
                  qtyReceived: 0,
                  unit: item.unit,
                  qtyPassed: 0,
                  qtyRejected: 0,
                  qcStatus: 'PENDING',
                  status: 'RECEIVED',
                  purchaseOrderLineId: item.purchaseOrderLineId,
                  purchaseRequestDetailId: item.purchaseRequestDetailId
                };
              })
            }
          },
          include: {
            items: { include: { product: true } }
          }
        });
      }

      return { updatedGR, autoCreatedGR };
    });

    res.status(200).json({
      success: true,
      message: 'GR approved and stock updated successfully',
      data: {
        ...result.updatedGR,
        autoCreatedGR: result.autoCreatedGR ? {
          id: result.autoCreatedGR.id,
          grNumber: result.autoCreatedGR.grNumber,
          itemCount: result.autoCreatedGR.items.length,
          items: result.autoCreatedGR.items.map(item => ({
            productId: item.productId,
            productName: item.product?.name,
            qtyPlanReceived: item.qtyPlanReceived
          }))
        } : null
      }
    });
  } catch (error) {
    console.error('Error approving GR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve GR',
      details: error.message
    });
  }
};
