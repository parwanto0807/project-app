import { prisma } from "../../config/db.js";

export const mrController = {
  // 1. Create MR (Setelah PR Approved - Source Internal)
  createMR: async (req, res) => {
    const { prId, warehouseId, projectId, requestedById, items } = req.body;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Generate MR Number sederhana
        const count = await tx.materialRequisition.count();
        const mrNumber = `MR-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const newMR = await tx.materialRequisition.create({
          data: {
            mrNumber,
            projectId,
            requestedById,
            warehouseId,
            status: 'PENDING',
            items: {
              create: items.map(item => ({
                productId: item.productId,
                purchaseRequestDetailId: item.prDetailId,
                qtyRequested: item.qty,
                qtyIssued: 0, // Belum keluar
                unit: item.unit
              }))
            }
          },
          include: { items: true }
        });

        return newMR;
      });

      res.status(201).json({ success: true, data: result, message: "MR Created successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 2. Scan & Issue (Proses Final Pengambilan Barang)
  issueMR: async (req, res) => {
    const { qrToken, issuedById } = req.body;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Cari MR berdasarkan Token
        const mr = await tx.materialRequisition.findUnique({
          where: { qrToken },
          include: { items: true }
        });

        if (!mr || mr.status === 'ISSUED') {
          throw new Error("MR tidak valid atau sudah pernah dikeluarkan");
        }

        // Get current month period for StockBalance
        const now = new Date();
        const period = new Date(now.getFullYear(), now.getMonth(), 1);

        // 2. Loop setiap item untuk eksekusi FIFO
        for (const item of mr.items) {
          let remainingToTake = Number(item.qtyRequested);
          let totalCost = 0;

          // PRE-VALIDATION: Check if bookedStock is sufficient
          // This ensures the stock was properly reserved when MR was approved
          let stockBalance = await tx.stockBalance.findUnique({
            where: {
              productId_warehouseId_period: {
                productId: item.productId,
                warehouseId: mr.warehouseId,
                period: period
              }
            }
          });

          // If no stock balance exists or bookedStock is less than requested
          if (!stockBalance) {
            throw new Error(`Stok untuk produk ${item.productId} tidak ditemukan di gudang ini`);
          }

          // Check if there's enough booked stock (this should have been reserved during approval)
          if (Number(stockBalance.bookedStock) < remainingToTake) {
            throw new Error(
              `Stok yang di-booking (${stockBalance.bookedStock}) tidak mencukupi untuk produk ${item.productId}. ` +
              `Dibutuhkan: ${remainingToTake}. Stok tersedia: ${stockBalance.availableStock}`
            );
          }

          // Log query parameters for debugging
          console.log(`🔍 Searching for FIFO batches with:`, {
            productId: item.productId,
            warehouseId: mr.warehouseId,
            type: 'IN',
            residualQty_gt: 0,
            isFullyConsumed: false
          });

          // First, check ALL StockDetail records for this product (for debugging)
          const allBatches = await tx.stockDetail.findMany({
            where: {
              productId: item.productId,
              warehouseId: mr.warehouseId
            },
            select: {
              id: true,
              type: true,
              residualQty: true,
              isFullyConsumed: true,
              transQty: true,
              createdAt: true
            },
            orderBy: { createdAt: 'asc' }
          });

          console.log(`📋 ALL StockDetail records for this product:`, 
            allBatches.map(b => ({
              id: b.id.substring(0, 8),
              type: b.type,
              residualQty: b.residualQty,
              isFullyConsumed: b.isFullyConsumed,
              transQty: b.transQty,
              createdAt: b.createdAt
            }))
          );

          // Now get only valid FIFO batches
          const batches = await tx.stockDetail.findMany({
            where: {
              productId: item.productId,
              warehouseId: mr.warehouseId,
              residualQty: { gt: 0 },
              isFullyConsumed: false,
              type: { in: ['IN', 'ADJUSTMENT_IN'] } // Include both IN and ADJUSTMENT_IN (from Stock Opname)
            },
            orderBy: { createdAt: 'asc' }
          });

          // Log available batches for debugging
          console.log(`📦 Product ${item.productId} - Available FIFO Batches:`, 
            batches.map(b => ({
              id: b.id.substring(0, 8),
              residualQty: b.residualQty,
              pricePerUnit: b.pricePerUnit,
              createdAt: b.createdAt
            }))
          );
          
          const totalAvailableInBatches = batches.reduce((sum, b) => sum + Number(b.residualQty), 0);
          console.log(`📊 Total available in batches: ${totalAvailableInBatches}, Needed: ${remainingToTake}`);

          for (const batch of batches) {
            if (remainingToTake <= 0) break;

            const takeAmount = Math.min(Number(batch.residualQty), remainingToTake);
            
            // A. Update StockDetail (Potong Sisa)
            await tx.stockDetail.update({
              where: { id: batch.id },
              data: {
                residualQty: { decrement: takeAmount },
                isFullyConsumed: (Number(batch.residualQty) - takeAmount) === 0
              }
            });

            // B. Catat Allocation (Audit Trail)
            await tx.stockAllocation.create({
              data: {
                mrItemId: item.id,
                stockDetailId: batch.id,
                qtyTaken: takeAmount
              }
            });

            // Track cost for weighted average price
            totalCost += takeAmount * Number(batch.pricePerUnit);
            remainingToTake -= takeAmount;
          }

          if (remainingToTake > 0) {
            throw new Error(
              `Stok fisik (FIFO batches) untuk produk ${item.productId} tidak mencukupi. ` +
              `Dibutuhkan: ${item.qtyRequested}, Tersedia di batch: ${totalAvailableInBatches}, ` +
              `Kurang: ${remainingToTake}. ` +
              `StockBalance menunjukkan bookedStock: ${stockBalance.bookedStock}, ` +
              `tapi batch FIFO tidak mencukupi. Mungkin ada inkonsistensi data.`
            );
          }

          // C. Update StockBalance for current month
          const qtyIssued = Number(item.qtyRequested);
          
          // Update existing StockBalance (we already fetched it above)
          stockBalance = await tx.stockBalance.update({
            where: {
              productId_warehouseId_period: {
                productId: item.productId,
                warehouseId: mr.warehouseId,
                period: period
              }
            },
            data: {
              stockOut: { increment: qtyIssued },
              stockAkhir: { decrement: qtyIssued },
              bookedStock: { decrement: qtyIssued },
              availableStock: { increment: 0 } // availableStock stays same since we're reducing both stockAkhir and bookedStock
            }
          });

          // D. Create StockDetail OUT record
          const avgPrice = totalCost / qtyIssued;
          const stockAwalSnapshot = Number(stockBalance.stockAkhir) + qtyIssued;
          const stockAkhirSnapshot = Number(stockBalance.stockAkhir);

          await tx.stockDetail.create({
            data: {
              productId: item.productId,
              warehouseId: mr.warehouseId,
              type: 'OUT',
              source: 'PROJECT',
              baseQty: qtyIssued,
              transQty: qtyIssued,
              transUnit: item.unit,
              stockAwalSnapshot: stockAwalSnapshot,
              stockAkhirSnapshot: stockAkhirSnapshot,
              residualQty: 0,
              isFullyConsumed: true,
              pricePerUnit: avgPrice,
              referenceNo: mr.mrNumber,
              materialRequisitionItemId: item.id
            }
          });

          // E. Update qtyIssued di MR Item
          await tx.materialRequisitionItem.update({
            where: { id: item.id },
            data: { qtyIssued: item.qtyRequested }
          });

          // F. Update PurchaseRequestDetail if linked
          if (item.purchaseRequestDetailId) {
            await tx.purchaseRequestDetail.update({
              where: { id: item.purchaseRequestDetailId },
              data: {
                jumlahTerpenuhi: { increment: qtyIssued }
              }
            });
          }
        }

        // 3. Update Status MR Header
        return await tx.materialRequisition.update({
          where: { id: mr.id },
          data: { 
            status: 'ISSUED', 
            issuedById, 
            updatedAt: new Date() 
          }
        });
      });

      res.json({ success: true, data: result, message: "Barang berhasil dikeluarkan (Stok terpotong)" });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // 3. Get MR List (With Pagination)
  getMRList: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    try {
      const [data, totalCount] = await Promise.all([
        prisma.materialRequisition.findMany({
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            Warehouse: {
              select: {
                name: true
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    code: true
                  }
                }
              }
            }
          }
        }),
        prisma.materialRequisition.count()
      ]);

      // Manually fetch related data since schema doesn't have relations
      const projectIds = [...new Set(data.map(mr => mr.projectId))];
      const karyawanIds = [...new Set(data.map(mr => mr.requestedById).filter(Boolean))];

      const [projects, karyawans] = await Promise.all([
        prisma.project.findMany({
          where: { id: { in: projectIds } },
          select: { id: true, name: true }
        }),
        prisma.karyawan.findMany({
          where: { id: { in: karyawanIds } },
          select: { id: true, namaLengkap: true, departemen: true }
        })
      ]);

      // Create lookup maps
      const projectMap = new Map(projects.map(p => [p.id, p]));
      const karyawanMap = new Map(karyawans.map(k => [k.id, k]));

      // Attach related data to MR records
      const enrichedData = data.map(mr => {
        const project = projectMap.get(mr.projectId);
        const karyawan = karyawanMap.get(mr.requestedById);

        return {
          ...mr,
          project: project ? { name: project.name } : null,
          requestedBy: karyawan ? {
            name: karyawan.namaLengkap,
            department: karyawan.departemen
          } : null
        };
      });

      const totalPages = Math.ceil(totalCount / pageSize);

      const response = {
        success: true,
        data: {
          data: enrichedData,
          pagination: {
            totalCount,
            totalPages,
            currentPage: page,
            pageSize,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};