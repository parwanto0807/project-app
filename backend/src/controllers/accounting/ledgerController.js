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
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (startDate === endDate) {
          end.setHours(23, 59, 59, 999);
        }

        where.transactionDate = {
          gte: start,
          lte: end,
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

      // Calculate global aggregated stats
      const aggregatedResult = await prisma.ledger.findMany({
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

      let totalDebit = 0;
      let totalCredit = 0;
      let balancedCount = 0;

      aggregatedResult.forEach((ledger) => {
        const ledgerDebit = ledger.ledgerLines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
        const ledgerCredit = ledger.ledgerLines.reduce((sum, line) => sum + Number(line.creditAmount), 0);
        
        totalDebit += ledgerDebit;
        totalCredit += ledgerCredit;

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
        },
      });

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

  // Get General Ledger (Grouped by Ledger Transactions/Journals)
  // This is used for the main Ledger page which expects Ledger objects
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
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (startDate === endDate) {
          end.setHours(23, 59, 59, 999);
        }

        where.transactionDate = {
          gte: start,
          lte: end,
        };
      }

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

      // Calculate aggregates
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

      let totalDebit = 0;
      let totalCredit = 0;
      let balancedCount = 0;

      allLedgers.forEach((ledger) => {
        const ledgerDebit = ledger.ledgerLines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
        const ledgerCredit = ledger.ledgerLines.reduce((sum, line) => sum + Number(line.creditAmount), 0);
        
        totalDebit += ledgerDebit;
        totalCredit += ledgerCredit;

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

  // Get Individual Ledger Lines (Postings)
  // This is used for Detail Sheets or analytical views where every line counts
  async getGeneralLedgerPostings(req, res) {
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

      if (periodId) where.ledger = { periodId };
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (startDate === endDate) {
          // Robust 24-hour window from the exact start moment
          end.setTime(start.getTime() + 24 * 60 * 60 * 1000 - 1);
        }

        where.ledger = {
          ...where.ledger,
          transactionDate: {
            gte: start,
            lte: end,
          },
          status: 'POSTED' // Only show posted transactions to match GL Summary
        };
      } else {
        // Even without specific dates, we should only see posted lines in this context
        where.ledger = { ...where.ledger, status: 'POSTED' };
      }

      if (coaId) {
        where.coaId = coaId;
      }

      if (search) {
        where.OR = [
          { description: { contains: search, mode: "insensitive" } },
          { reference: { contains: search, mode: "insensitive" } },
          { ledger: { ledgerNumber: { contains: search, mode: "insensitive" } } },
          { ledger: { description: { contains: search, mode: "insensitive" } } },
          { coa: { name: { contains: search, mode: "insensitive" } } },
          { coa: { code: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [ledgerLines, total] = await Promise.all([
        prisma.ledgerLine.findMany({
          where,
          include: {
            coa: true,
            project: true,
            customer: true,
            supplier: true,
            karyawan: true,
            ledger: {
              include: {
                period: true,
                ledgerLines: {
                   include: { coa: true }
                }
              }
            }
          },
          orderBy: { ledger: { transactionDate: 'desc' } },
          skip,
          take,
        }),
        prisma.ledgerLine.count({ where }),
      ]);

      const allLines = await prisma.ledgerLine.findMany({
        where,
        select: {
          debitAmount: true,
          creditAmount: true,
        },
      });

      let totalDebit = 0;
      let totalCredit = 0;

      allLines.forEach((line) => {
        totalDebit += Number(line.debitAmount);
        totalCredit += Number(line.creditAmount);
      });

      return res.status(200).json({
        success: true,
        data: ledgerLines,
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
          balancedCount: 0,
        },
      });

    } catch (error) {
      console.error("Get General Ledger Postings Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
}

export default new LedgerController();
