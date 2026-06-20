import { prisma } from "../../config/db.js";
import { startOfMonth, endOfMonth, parse } from "date-fns";

export const stockMonitoringController = {
  getMonitoringData: async (req, res) => {
    try {
      // 1. Ambil query parameters
      // period diharapkan berformat "YYYY-MM" (contoh: "2024-01")
      const { 
        search, 
        warehouseId, 
        period, 
        status, // Tambahkan parameter status
        page = 1, 
        limit = 10 
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // 2. Build Query Constraints
      const where = {};

      // Filter Berdasarkan Nama/Kode Product
      if (search) {
        const searchTrimmed = search.trim();
        
        // Jika search tidak kosong setelah trim
        if (searchTrimmed) {
          // Split search menjadi kata-kata untuk multi-word search
          const words = searchTrimmed.split(/\s+/).filter(w => w.length > 0);
          
          if (words.length === 1) {
            // Single word search - cari di salah satu field
            where.product = {
              isActive: status === 'inactive' ? undefined : true,
              OR: [
                { name: { contains: words[0], mode: 'insensitive' } },
                { code: { contains: words[0], mode: 'insensitive' } },
                { category: { name: { contains: words[0], mode: 'insensitive' } } },
              ],
            };
          } else {
            // Multiple words search - cari yang mengandung semua kata
            where.product = {
              isActive: status === 'inactive' ? undefined : true,
              AND: words.map((word) => ({
                OR: [
                  { name: { contains: word, mode: 'insensitive' } },
                  { code: { contains: word, mode: 'insensitive' } },
                  { category: { name: { contains: word, mode: 'insensitive' } } },
                ],
              })),
            };
          }
        }
      } else {
         // Default: hanya tampilkan produk aktif, kecuali user eksplisit minta inactive
         if (status !== 'inactive') {
            where.product = { isActive: true };
         }
      }

      // Filter Berdasarkan Warehouse
      if (warehouseId && warehouseId !== 'all') {
        where.warehouseId = warehouseId;
      }

      // --- LOGIKA PER PERIODE ---
      // Jika user tidak mengirim period, gunakan bulan saat ini
      const referenceDate = period 
        ? parse(period, 'yyyy-MM', new Date()) 
        : new Date();

      where.period = {
        gte: startOfMonth(referenceDate),
        lte: endOfMonth(referenceDate),
      };

      // --- LOGIKA STATUS FILTER ---
      // Karena availableStock (stockAkhir - bookedStock) mungkin perlu logic db raw atau computed,
      // pendekatan termudah adalah filter di level aplikasi setelah fetch jika data tidak terlalu besar,
      // TAPI untuk pagination yang benar, kita harus rely on DB features.
      // 
      // Prisma tidak support filtering on calculated fields di `findMany` standard secara langsung jika fieldnya tidak ada di DB.
      // Di schema, `availableStock` ada di model `StockBalance`.
      // Jadi kita BISA filter langsung.
      
      if (status && status !== 'all') {
        if (status === 'items_critical' || status === 'CRITICAL') {
           // availableStock <= 0
           where.availableStock = { lte: 0 };
        } else if (status === 'items_warning' || status === 'WARNING') {
           // 0 < availableStock < 10
           where.availableStock = { gt: 0, lt: 10 };
        } else if (status === 'items_safe' || status === 'SAFE') {
           // availableStock >= 10
           where.availableStock = { gte: 10 };
        } else if (status === 'inactive') {
           // Overwrite filter isActive diatas, tapi pertahankan filter lain (misal search)
           where.product = {
             ...(where.product || {}),
             isActive: false
           };
        }
      }

      // 3. Query Data & Total Count & Aggregation & Stats
      // Konstruksi Base Where (untuk stats) - Tanpa filter status dari tab
      const baseWhere = { ...where };
      delete baseWhere.availableStock; // Hapus filter status spesifik jika ada
      // Jika status 'inactive' dipilih, baseWhere mungkin punya product.isActive: false.
      // Kita perlu reset product filter untuk stats "Total" (active items), "Critical", dll.
      // Namun, logic search search mungkin menempel di product.
      
      // Simplifikasi:
      // Base stats harusnya:
      // - Filter Warehouse
      // - Filter Period
      // - Filter Search (tetap diaplikasikan)
      
      // Kita perlu membangun ulang `where` untuk stats agar akurat.
      // Cek apakah 'product' filter ada.
      const statsWhere = { ...where };
      
      // Hapus kondisi 'availableStock' yang mungkin ditambahkan oleh filter status
      delete statsWhere.availableStock;
      
      // Reset filter product.isActive menjadi true untuk stats standar (Total, Safe, Warning, Critical)
      if (statsWhere.product) {
         // Jika search ada, kita pertahankan, tapi paksa isActive: true untuk kategori aktif
         statsWhere.product = {
            ...statsWhere.product,
            isActive: true
         };
      } else {
         statsWhere.product = { isActive: true };
      }

      // Query Stats (Parallel)
      const [balances, totalCount, aggregations, statsTotal, statsCritical, statsWarning, statsSafe, statsInactive] = await prisma.$transaction([
        // 1. Data Utama (dengan filter lengkap user)
        prisma.stockBalance.findMany({
          where: where,
          skip: skip,
          take: limitNum,
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                storageUnit: true,
                purchaseUnit: true, // Added
                conversionToStorage: true, // Added
                usageUnit: true, // Added
                conversionToUsage: true, // Added
                category: { select: { name: true } },
                isActive: true
              }
            },
            warehouse: { select: { name: true } }
          },
          orderBy: { updatedAt: 'desc' }
        }),
        // 2. Total Count (untuk pagination utama)
        prisma.stockBalance.count({ where: where }),
        // 3. Aggregation (Total Value untuk main filter)
        // Opsional: Total Value biasanya ingin 'Global' atau 'Filtered'? 
        // Request sebelumnya: "Berdasarkan periode". Asumsi: mengikuti filter tab juga? 
        // Jika user minta "Gabungkan dengan Detailed Stats", dan Detailed Stats itu global per periode, mungkin Total Value juga harus global?
        // Mari kita bikin Total Value mengikuti FILTER UTAMA saja dulu (konsisten dengan data tabel).
        prisma.stockBalance.aggregate({
          where: where,
          _sum: { inventoryValue: true }
        }),

        // --- STATS GLOBAL (Per Periode, ignore status tab) ---
        // A. Total Active Items
        prisma.stockBalance.count({ where: { ...statsWhere } }),
        // B. Critical (<= 0)
        prisma.stockBalance.count({ where: { ...statsWhere, availableStock: { lte: 0 } } }),
        // C. Warning (0 < x < 10)
        prisma.stockBalance.count({ where: { ...statsWhere, availableStock: { gt: 0, lt: 10 } } }),
        // D. Safe (>= 10)
        prisma.stockBalance.count({ where: { ...statsWhere, availableStock: { gte: 10 } } }),
        // E. Inactive
        // Reconstruct query safely
        (() => {
            const productFilter = baseWhere.product ? { ...baseWhere.product } : {};
            // Explicitly remove any existing isActive constraint passed from 'where'
            delete productFilter.isActive;
            
            return prisma.stockBalance.count({ 
                where: { 
                    ...baseWhere,
                    availableStock: undefined, // Ensure availableStock filter is removed
                    product: { 
                        ...productFilter, 
                        isActive: false 
                    } 
                } 
            });
        })()
      ]);

      // 4. Helper Formatting
      const toNumber = (val) => {
        if (!val) return 0;
        return typeof val.toNumber === 'function' ? val.toNumber() : Number(val);
      };

      const totalInventoryValue = toNumber(aggregations._sum.inventoryValue);

      const formattedData = balances.map(balance => {
        const available = toNumber(balance.availableStock);
        return {
          id: balance.id,
          productId: balance.product.id,
          code: balance.product.code,
          name: balance.product.name,
          category: balance.product.category?.name,
          storageUnit: balance.product.storageUnit,
          purchaseUnit: balance.product.purchaseUnit, // Added
          conversionToStorage: Number(balance.product.conversionToStorage), // Added
          usageUnit: balance.product.usageUnit, // Added
          conversionToUsage: Number(balance.product.conversionToUsage), // Added
          isActive: balance.product.isActive,
          warehouse: balance.warehouse?.name || 'Unknown',
          warehouseId: balance.warehouseId,
          period: balance.period,
          stockAwal: toNumber(balance.stockAwal),
          stockIn: toNumber(balance.stockIn),
          stockOut: toNumber(balance.stockOut),
          justIn: toNumber(balance.justIn),
          justOut: toNumber(balance.justOut),
          onPR: toNumber(balance.onPR),
          bookedStock: toNumber(balance.bookedStock),
          stockAkhir: toNumber(balance.stockAkhir),
          availableStock: available,
          inventoryValue: toNumber(balance.inventoryValue),
          updatedAt: balance.updatedAt,
          status: available <= 0 ? 'CRITICAL' : (available < 10 ? 'WARNING' : 'SAFE')
        };
      });

      // 5. Response sesuai interface ListResponse<T>
      const totalPages = Math.ceil(totalCount / limitNum);

      return res.status(200).json({
        success: true,
        data: {
          data: formattedData,
          pagination: {
            totalCount,
            totalPages,
            currentPage: pageNum,
            pageSize: limitNum,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
          },
          summary: {
            totalInventoryValue,
            stats: {
                total: statsTotal,
                critical: statsCritical,
                warning: statsWarning,
                safe: statsSafe,
                inactive: statsInactive
            }
          }
        }
      });

    } catch (error) {
      console.error("Stock Monitoring Error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "SERVER_ERROR",
        message: error.message 
      });
    }
  },

  getStockHistory: async (req, res) => {
    try {
      const { productId, warehouseId, period } = req.query;

      if (!productId) {
        return res.status(400).json({ success: false, message: "ProductId is required" });
      }

      // --- Define Date Range ---
      const referenceDate = period 
        ? parse(period, 'yyyy-MM', new Date()) 
        : new Date();
      
      const startDate = startOfMonth(referenceDate);
      const endDate = endOfMonth(referenceDate);

      // --- Query StockDetail ---
      // We want all transactions for this product, in this period.
      // Filter by warehouseId if provided.
      const where = {
        productId: productId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (warehouseId && warehouseId !== 'all') {
        where.warehouseId = warehouseId;
      }

      const history = await prisma.stockDetail.findMany({
        where: where,
        orderBy: { createdAt: 'desc' },
        include: {
          warehouse: { select: { name: true } }
        }
      });

      // --- Calculate Running Balance (Optional / Complex) ---
      // For now, just return the transactions raw
      const formattedHistory = history.map(item => ({
        id: item.id,
        date: item.createdAt,
        type: item.type, // IN, OUT, ADJUSTMENT
        source: item.source, // PO, SALES, etc.
        qty: parseFloat(item.transQty),
        unit: item.transUnit,
        price: parseFloat(item.pricePerUnit),
        warehouse: item.warehouse?.name,
        notes: item.notes,
        referenceNo: item.referenceNo,
        stockAkhirSnapshot: parseFloat(item.stockAkhirSnapshot || 0),
        baseQty: parseFloat(item.baseQty || item.transQty)
      }));

      return res.status(200).json({
        success: true,
        data: formattedHistory
      });

    } catch (error) {
      console.error("Stock History Error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "SERVER_ERROR", 
        message: error.message 
      });
    }
  },
  
  getLatestStockBalance: async (req, res) => {
    try {
      const { productId, warehouseId } = req.query;

      if (!productId) {
        return res.status(400).json({ success: false, message: "ProductId is required" });
      }

      // Period bulan ini (Force UTC 00:00:00 to match DB stored periods)
      const now = new Date();
      // Keep currentPeriod for legacy/fallback if needed
      const currentPeriod = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

      let stockValue = 0;
      let breakdown = [];

      if (req.query.detail === 'true') {
         // Get all active warehouses to ensure we check every possible storage location
         const warehouses = await prisma.warehouse.findMany({
             where: { isActive: true },
             select: { id: true, name: true, isWip: true }
         });
         
         // Fetch latest balance for each warehouse regardless of period (Snapshot approach)
         breakdown = await Promise.all(warehouses.map(async (wh) => {
             // Find the latest balance entry for this product & warehouse
             const latestBalance = await prisma.stockBalance.findFirst({
                 where: {
                     productId: productId,
                     warehouseId: wh.id
                 },
                 orderBy: { period: 'desc' },
                 take: 1
             });
             
             // If no balance record exists at all, we skip
             if (!latestBalance) {
                 return null;
             }
             
             // Find the oldest batch that still has stock for this product in this warehouse (FIFO)
             const oldestBatch = await prisma.stockDetail.findFirst({
                 where: {
                     productId: productId,
                     warehouseId: wh.id,
                     residualQty: { gt: 0 },
                     isFullyConsumed: false
                 },
                 orderBy: { createdAt: 'asc' },
                 select: { pricePerUnit: true, residualQty: true, type: true, source: true }
             });
             
             return {
                 warehouseId: wh.id,
                 warehouseName: wh.name,
                 stock: Number(latestBalance.availableStock), // Use availableStock as stock for simple display
                 price: oldestBatch ? Number(oldestBatch.pricePerUnit) : 0,
                 stockAkhir: Number(latestBalance.stockAkhir),
                 bookedStock: Number(latestBalance.bookedStock),
                 availableStock: Number(latestBalance.availableStock),
                 isWip: wh.isWip
             };
         }));

         // Filter out nulls
         breakdown = breakdown.filter(b => b !== null);

         // Calculate total from breakdown to ensure consistency
         stockValue = breakdown.reduce((sum, item) => sum + item.stock, 0);

         return res.status(200).json({
          success: true,
          data: stockValue,
          breakdown: breakdown // Return breakdown explicitly
        });
      }

      if (warehouseId) {
        // Specific Warehouse - Find Latest
        const balance = await prisma.stockBalance.findFirst({
          where: {
            productId: productId,
            warehouseId: warehouseId
          },
          orderBy: { period: 'desc' },
          select: { availableStock: true }
        });
        stockValue = balance ? Number(balance.availableStock) : 0;
      } else {
        // All Warehouses (Aggregate) - Sum of Latest of each warehouse
         const warehouses = await prisma.warehouse.findMany({
             where: { isActive: true },
             select: { id: true }
         });

         const balances = await Promise.all(warehouses.map(async (wh) => {
             const b = await prisma.stockBalance.findFirst({
                 where: { productId, warehouseId: wh.id },
                 orderBy: { period: 'desc' },
                 select: { availableStock: true }
             });
             return b ? Number(b.availableStock) : 0;
         }));

         stockValue = balances.reduce((a, b) => a + b, 0);
      }

      return res.status(200).json({
        success: true,
        data: stockValue
      });

    } catch (error) {
      console.error("Get Latest Stock Error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: error.message
      });
    }
  },

  getStockBookings: async (req, res) => {
    try {
      const { productId, warehouseId } = req.query;

      if (!productId) {
        return res.status(400).json({ success: false, message: "ProductId is required" });
      }

      // Query all non-cancelled PRs with warehouse allocations for this product
      const bookings = await prisma.purchaseRequestDetail.findMany({
        where: {
          productId: productId,
          purchaseRequest: {
            status: {
              notIn: ['DRAFT', 'REJECTED', 'REVISION_NEEDED', 'COMPLETED'] // Include APPROVED, SUBMITTED
            }
          },
          warehouseAllocation: {
            not: null
          }
        },
        include: {
          purchaseRequest: {
            select: {
              id: true,
              nomorPr: true,
              status: true,
              tanggalPr: true,
              karyawan: {
                select: {
                  namaLengkap: true
                }
              },
              project: {
                select: {
                  name: true
                }
              }
            }
          },
          product: {
            select: {
              name: true,
              code: true,
              storageUnit: true,
              purchaseUnit: true,
              conversionToStorage: true
            }
          }
        }
      });

      // Filter active bookings where jumlah > jumlahDipesan
      const activeBookings = bookings.filter(detail => {
        const jumlah = Number(detail.jumlah);
        const jumlahDipesan = Number(detail.jumlahDipesan || 0);
        // Only show if not yet fully ordered
        return jumlahDipesan < jumlah;
      });

      // Filter and format bookings for specific warehouse (if provided)
      const detailedBookings = activeBookings
        .map(detail => {
          let allocations = [];
          if (typeof detail.warehouseAllocation === 'string') {
            try { allocations = JSON.parse(detail.warehouseAllocation); } catch (e) {}
          } else if (Array.isArray(detail.warehouseAllocation)) {
            allocations = detail.warehouseAllocation;
          }
          
          if (!allocations || allocations.length === 0) return null;

          const prQty = Number(detail.jumlah || 0);
          const prOrdered = Number(detail.jumlahDipesan || 0);
          const prRemaining = prQty - prOrdered;

          return allocations.map(alloc => {
            if (warehouseId && warehouseId !== 'all' && alloc.warehouseId !== warehouseId) {
              return null;
            }

            // Cap the booked quantity at the remaining unordered PR quantity
            const bookedQty = Math.min(Number(alloc.allocatedQty || 0), prRemaining);
            if (bookedQty <= 0) return null;

            // Conversion handling
            let conversion = 1;
            const prUnit = detail.unit || detail.product.purchaseUnit;
            if (prUnit !== detail.product.storageUnit) {
              conversion = Number(detail.product.conversionToStorage) || 1;
            }
            
            const bookedQtyInStorageUnit = bookedQty * conversion;

            return {
              prNumber: detail.purchaseRequest.nomorPr,
              prId: detail.purchaseRequest.id,
              prDate: detail.purchaseRequest.tanggalPr,
              requestor: detail.purchaseRequest.karyawan?.namaLengkap || 'Unknown',
              project: detail.purchaseRequest.project?.name || '-',
              productName: detail.product.name,
              productCode: detail.product.code,
              unit: detail.product.storageUnit,
              originalUnit: prUnit,
              originalQtyRemaining: bookedQty,
              bookedQty: bookedQtyInStorageUnit,
              warehouseName: alloc.warehouseName || 'Unknown',
              warehouseId: alloc.warehouseId,
              status: detail.purchaseRequest.status,
              totalRequested: prQty,
              jumlahTerpenuhi: Number(detail.jumlahTerpenuhi || 0)
            };
          });
        })
        .flat()
        .filter(Boolean); // Remove nulls

      // Calculate total booked
      const totalBooked = detailedBookings.reduce(
        (sum, booking) => sum + Number(booking.bookedQty), 
        0
      );

      return res.status(200).json({
        success: true,
        data: {
          productId,
          warehouseId: warehouseId || 'all',
          totalBooked,
          bookings: detailedBookings
        }
      });

    } catch (error) {
      console.error("Stock Bookings Error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "SERVER_ERROR",
        message: error.message 
      });
    }
  },

  getStockOnPO: async (req, res) => {
    try {
      const { productId, warehouseId } = req.query;

      if (!productId) {
        return res.status(400).json({ success: false, message: "ProductId is required" });
      }

      // Query active PO lines
      const activePOLines = await prisma.purchaseOrderLine.findMany({
        where: {
          productId: productId,
          purchaseOrder: {
            status: {
              in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED']
            }
          }
        },
        include: {
          purchaseOrder: {
            select: {
              id: true,
              poNumber: true,
              orderDate: true,
              status: true,
              supplier: {
                select: { name: true }
              },
              warehouse: {
                select: { id: true, name: true }
              }
            }
          },
          product: {
            select: {
              name: true,
              code: true,
              storageUnit: true,
              purchaseUnit: true,
              conversionToStorage: true
            }
          }
        }
      });

      // Filter and format lines
      const detailedOnPO = activePOLines
        .map(line => {
          const po = line.purchaseOrder;
          
          // Filter by warehouse if specified
          if (warehouseId && warehouseId !== 'all' && po.warehouse?.id !== warehouseId) {
            return null;
          }

          const qtyOrdered = Number(line.quantity || 0);
          const qtyReceived = Number(line.receivedQuantity || 0);
          const qtyRemaining = qtyOrdered - qtyReceived;

          if (qtyRemaining <= 0) return null;

          // Conversion to storage unit
          let conversion = 1;
          const poUnit = line.unit || line.product.purchaseUnit;
          if (poUnit !== line.product.storageUnit) {
             conversion = Number(line.product.conversionToStorage) || 1;
          }
          
          const onPOQtyInStorageUnit = qtyRemaining * conversion;

          return {
            poNumber: po.poNumber,
            poId: po.id,
            poDate: po.orderDate,
            supplier: po.supplier?.name || 'Unknown',
            productName: line.product.name,
            productCode: line.product.code,
            unit: line.product.storageUnit, // We display in storage unit
            originalUnit: poUnit,
            originalQtyRemaining: qtyRemaining,
            onPOQty: onPOQtyInStorageUnit, // Equivalent to bookedQty
            warehouseName: po.warehouse?.name || 'Unknown',
            warehouseId: po.warehouse?.id,
            status: po.status
          };
        })
        .filter(Boolean);

      const totalOnPO = detailedOnPO.reduce((sum, item) => sum + item.onPOQty, 0);

      return res.status(200).json({
        success: true,
        data: {
          productId,
          warehouseId: warehouseId || 'all',
          totalOnPO,
          onPOItems: detailedOnPO
        }
      });

    } catch (error) {
      console.error("Stock On PO Error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "SERVER_ERROR",
        message: error.message 
      });
    }
  },

  getTopUsage: async (req, res) => {
    try {
      const { period, limit = 5, warehouseId } = req.query;
      const limitNum = parseInt(limit);
      
      const referenceDate = period 
        ? parse(period, 'yyyy-MM', new Date()) 
        : new Date();

      const startDate = startOfMonth(referenceDate);
      const endDate = endOfMonth(referenceDate);

      const where = {
        period: {
          gte: startDate,
          lte: endDate
        },
        stockOut: { gt: 0 } // Hanya yang ada pemakaian (keluar)
      };

      if (warehouseId && warehouseId !== 'all') {
        where.warehouseId = warehouseId;
      }

      // Fetch all to deduplicate in memory, since we want unique products
      const allUsage = await prisma.stockBalance.findMany({
        where,
        orderBy: { stockOut: 'desc' },
        include: {
          product: {
            select: { id: true, code: true, name: true, storageUnit: true, category: { select: { name: true } } }
          },
          warehouse: { select: { name: true } }
        }
      });

      // Deduplicate by productId: keep only the highest stockOut (which is the first one encountered)
      const uniqueUsage = [];
      const seenProductIds = new Set();
      for (const item of allUsage) {
        if (!seenProductIds.has(item.productId)) {
          seenProductIds.add(item.productId);
          uniqueUsage.push(item);
        }
      }

      const topUsage = uniqueUsage.slice(0, limitNum);

      const formatted = topUsage.map(item => ({
        id: item.id,
        productId: item.productId,
        productCode: item.product.code,
        productName: item.product.name,
        category: item.product.category?.name || "-",
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse?.name || "-",
        stockOut: Number(item.stockOut),
        unit: item.product.storageUnit,
      }));

      return res.status(200).json({
        success: true,
        data: formatted
      });
    } catch (error) {
      console.error("Get Top Usage Error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "SERVER_ERROR",
        message: error.message 
      });
    }
  },

  getTopValue: async (req, res) => {
    try {
      const { period, limit = 5, warehouseId } = req.query;
      const limitNum = parseInt(limit);
      
      const referenceDate = period 
        ? parse(period, 'yyyy-MM', new Date()) 
        : new Date();

      const startDate = startOfMonth(referenceDate);
      const endDate = endOfMonth(referenceDate);

      const where = {
        period: {
          gte: startDate,
          lte: endDate
        },
        inventoryValue: { gt: 0 } // Hanya yang punya nilai
      };

      if (warehouseId && warehouseId !== 'all') {
        where.warehouseId = warehouseId;
      }

      // Fetch all to deduplicate in memory
      const allValue = await prisma.stockBalance.findMany({
        where,
        orderBy: { inventoryValue: 'desc' },
        include: {
          product: {
            select: { id: true, code: true, name: true, storageUnit: true, category: { select: { name: true } } }
          },
          warehouse: { select: { name: true } }
        }
      });

      // Deduplicate by productId: keep only the highest inventoryValue
      const uniqueValue = [];
      const seenProductIds = new Set();
      for (const item of allValue) {
        if (!seenProductIds.has(item.productId)) {
          seenProductIds.add(item.productId);
          uniqueValue.push(item);
        }
      }

      const topValue = uniqueValue.slice(0, limitNum);

      const formatted = topValue.map(item => ({
        id: item.id,
        productId: item.productId,
        productCode: item.product.code,
        productName: item.product.name,
        category: item.product.category?.name || "-",
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse?.name || "-",
        inventoryValue: Number(item.inventoryValue),
        stockAkhir: Number(item.stockAkhir),
        unit: item.product.storageUnit,
      }));

      return res.status(200).json({
        success: true,
        data: formatted
      });
    } catch (error) {
      console.error("Get Top Value Error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "SERVER_ERROR",
        message: error.message 
      });
    }
  }
};
