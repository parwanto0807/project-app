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
        where.product = {
          // Hanya filter isActive jika tidak sedang mencari produk inactive
          isActive: status === 'inactive' ? undefined : true, 
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        };
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
                category: { select: { name: true } },
                isActive: true
              }
            },
            warehouse: { select: { name: true } }
          },
          orderBy: { period: 'desc' }
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
          isActive: balance.product.isActive,
          warehouse: balance.warehouse?.name || 'Unknown',
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
        referenceNo: item.referenceNo
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

      if (!productId || !warehouseId) {
        return res.status(400).json({ success: false, message: "ProductId and WarehouseId are required" });
      }

      // Period bulan ini
      const currentPeriod = startOfMonth(new Date());

      const balance = await prisma.stockBalance.findFirst({
        where: {
          productId: productId,
          warehouseId: warehouseId,
          period: currentPeriod
        },
        select: {
            stockAkhir: true
        }
      });

      return res.status(200).json({
        success: true,
        data: balance ? Number(balance.stockAkhir) : 0
      });

    } catch (error) {
      console.error("Get Latest Stock Error:", error);
      return res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: error.message
      });
    }
  }
};

