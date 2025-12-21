import { prisma } from "../../config/db.js";

export const stockMonitoringController = {
  getMonitoringData: async (req, res) => {
    try {
      const { search, warehouseId } = req.query;

      // 1. Build Query Constraints
      const where = {};

      // Filter by Product Name/Code
      if (search) {
        where.product = {
          isActive: true, // Only show active products by default
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        };
      }

      // Filter by Warehouse (Optional)
      if (warehouseId) {
        where.warehouseId = warehouseId;
      }

      // 2. Query StockBalance
      // Logic adjusted: Return raw list of balances with detailed fields
      
      const balances = await prisma.stockBalance.findMany({
        where: where,
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
          warehouse: {
            select: { name: true }
          }
        },
        orderBy: [
          { product: { name: 'asc' } },
          { warehouse: { name: 'asc' } }
        ]
      });

      // 3. Format Data
      // Map to flat structure for easier frontend display
      const formattedData = balances.map(balance => {
        // Helper to safely convert Prisma Decimal to Number
        const toNumber = (val) => {
          if (val === null || val === undefined) return 0;
          // Check if it has toNumber method (Decimal.js)
          if (typeof val.toNumber === 'function') return val.toNumber();
          // Fallback to Number constructor
          return Number(val) || 0;
        };

        return {
          id: balance.id, // StockBalance ID
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
          availableStock: toNumber(balance.availableStock),
          
          inventoryValue: toNumber(balance.inventoryValue),
          updatedAt: balance.updatedAt,
          
          // Logical Status based on Available Stock
          status: toNumber(balance.availableStock) <= 0 ? 'CRITICAL' : (toNumber(balance.availableStock) < 10 ? 'WARNING' : 'SAFE')
        };
      });

      return res.status(200).json({
        success: true,
        data: formattedData
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};
