import { prisma } from "../../config/db.js";

class LedgerController {
  // Get main ledger entries with filters
  async getLedgers(req, res) {
    try {
      const {
        periodId,
        startDate,
        endDate,
        status,
        search,
        page = 1,
        limit = 10,
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};

      if (periodId) where.periodId = periodId;
      if (status) where.status = status;

      if (startDate && endDate) {
        where.transactionDate = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      if (search) {
        where.OR = [
          { ledgerNumber: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { referenceNumber: { contains: search, mode: "insensitive" } },
        ];
      }

      const [ledgers, total] = await Promise.all([
        prisma.ledger.findMany({
          where,
          include: {
            period: true,
            ledgerLines: {
              include: {
                coa: true,
              },
            },
          },
          orderBy: { transactionDate: "desc" },
          skip,
          take,
        }),
        prisma.ledger.count({ where }),
      ]);

      // Calculate global aggregated stats (ALL data, not just current page)
      const allLedgers = await prisma.ledger.findMany({
        where,
        include: {
          ledgerLines: {
            select: {
              debitAmount: true,
              creditAmount: true,
            },
          },
        },
      });

      // Calculate totals from ALL ledgers
      let totalDebit = 0;
      let totalCredit = 0;
      let balancedCount = 0;

      allLedgers.forEach((ledger) => {
        const ledgerDebit = ledger.ledgerLines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
        const ledgerCredit = ledger.ledgerLines.reduce((sum, line) => sum + Number(line.creditAmount), 0);
        
        totalDebit += ledgerDebit;
        totalCredit += ledgerCredit;

        // Check if this ledger is balanced
        if (Math.abs(ledgerDebit - ledgerCredit) < 0.01) {
          balancedCount++;
        }
      });

      return res.status(200).json({
        success: true,
        data: ledgers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
        aggregates: {
          totalTransactions: total,
          totalDebit: Number(totalDebit.toFixed(2)),
          totalCredit: Number(totalCredit.toFixed(2)),
          balancedCount,
        },
      });
    } catch (error) {
      console.error("Get Ledgers Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }

  // Get specific ledger details
  async getLedgerById(req, res) {
    try {
      const { id } = req.params;

      const ledger = await prisma.ledger.findUnique({
        where: { id },
        include: {
          period: true,
          ledgerLines: {
            include: {
              coa: true,
              project: true,
              customer: true,
              supplier: true,
              karyawan: true,
            },
          },
          createdByUser: {
             select: { name: true }
          }
        },
      });

      // Note: createdByUser relation might not exist or be named differently based on User model. 
      // Checking Schema... schema doesn't seem to have explicit relation for createdBy to User model in what was provided.
      // The provided schema snippet for Ledger shows `createdBy String`. It doesn't show a @relation to User.
      // So I will remove `createdByUser` include to avoid errors.

      if (!ledger) {
        return res.status(404).json({
          success: false,
          message: "Ledger entry not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: ledger,
      });
    } catch (error) {
      console.error("Get Ledger By ID Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }

  // Get General Ledger (Grouped by Ledger Transactions)
  async getGeneralLedger(req, res) {
    try {
      const {
        periodId,
        startDate,
        endDate,
        coaId,
        search,
        page = 1,
        limit = 10,
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};

      if (periodId) where.periodId = periodId;
      if (startDate && endDate) {
        where.transactionDate = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      // If filtering by COA, we need to find Ledgers that have those COA lines
      if (coaId) {
        where.ledgerLines = {
          some: { coaId: coaId }
        };
      }

      if (search) {
        where.OR = [
          { ledgerNumber: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          {
            ledgerLines: {
              some: {
                OR: [
                  { description: { contains: search, mode: "insensitive" } },
                  { reference: { contains: search, mode: "insensitive" } },
                  { coa: { name: { contains: search, mode: "insensitive" } } },
                  { coa: { code: { contains: search, mode: "insensitive" } } },
                ]
              }
            }
          }
        ];
      }

      const [ledgers, total] = await Promise.all([
        prisma.ledger.findMany({
          where,
          include: {
            period: true,
            ledgerLines: {
              include: {
                coa: true,
                project: true,
                customer: true,
                supplier: true,
                karyawan: true,
              },
              orderBy: { lineNumber: 'asc' }
            },
          },
          orderBy: { transactionDate: 'desc' },
          skip,
          take,
        }),
        prisma.ledger.count({ where }),
      ]);

      // Calculate global aggregated stats (ALL data, not just current page)
      const allLedgers = await prisma.ledger.findMany({
        where,
        include: {
          ledgerLines: {
            select: {
              debitAmount: true,
              creditAmount: true,
            },
          },
        },
      });

      // Calculate totals from ALL ledgers
      let totalDebit = 0;
      let totalCredit = 0;
      let balancedCount = 0;

      allLedgers.forEach((ledger) => {
        const ledgerDebit = ledger.ledgerLines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
        const ledgerCredit = ledger.ledgerLines.reduce((sum, line) => sum + Number(line.creditAmount), 0);
        
        totalDebit += ledgerDebit;
        totalCredit += ledgerCredit;

        // Check if this ledger is balanced
        if (Math.abs(ledgerDebit - ledgerCredit) < 0.01) {
          balancedCount++;
        }
      });

      return res.status(200).json({
        success: true,
        data: ledgers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
        aggregates: {
          totalTransactions: total,
          totalDebit: Number(totalDebit.toFixed(2)),
          totalCredit: Number(totalCredit.toFixed(2)),
          balancedCount,
        },
      });

    } catch (error) {
      console.error("Get General Ledger Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
}

export default new LedgerController();
