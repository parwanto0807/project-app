import { prisma } from "../../config/db.js";
import { getJakartaStartOfDay, getJakartaEndOfDay } from "../../utils/dateUtils.js";
import { normalizeToJakartaStartOfDay } from "../../utils/dateUtils.js";

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
        const start = getJakartaStartOfDay(startDate);
        const end = getJakartaEndOfDay(endDate);

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
        const start = getJakartaStartOfDay(startDate);
        const end = getJakartaEndOfDay(endDate);
        
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

  // Void / Batalkan Ledger Entry
  async voidLedger(req, res) {
    try {
      const { id } = req.params;
      const { voidReason } = req.body;
      const userId = req.user?.id || "SYSTEM";

      if (!voidReason || voidReason.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Alasan pembatalan (voidReason) wajib diisi",
        });
      }

      // 1. Find the ledger with all lines
      const ledger = await prisma.ledger.findUnique({
        where: { id },
        include: {
          ledgerLines: { include: { coa: true } },
          period: true,
        },
      });

      // Also support lookup by ledgerNumber
      const ledgerByNumber = !ledger
        ? await prisma.ledger.findUnique({
            where: { ledgerNumber: id },
            include: {
              ledgerLines: { include: { coa: true } },
              period: true,
            },
          })
        : null;

      const target = ledger || ledgerByNumber;

      if (!target) {
        return res.status(404).json({
          success: false,
          message: `Ledger '${id}' tidak ditemukan`,
        });
      }

      if (target.status === "VOID") {
        return res.status(400).json({
          success: false,
          message: "Ledger ini sudah dibatalkan (VOID) sebelumnya",
        });
      }

      if (target.status === "LOCKED" || target.status === "RECONCILED") {
        return res.status(400).json({
          success: false,
          message: `Ledger dengan status ${target.status} tidak dapat dibatalkan`,
        });
      }

      // 2. Execute void in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // 2a. Reverse GeneralLedgerSummary for each line
        for (const line of target.ledgerLines) {
          const normalizedDate = normalizeToJakartaStartOfDay(target.transactionDate);

          const summary = await tx.generalLedgerSummary.findUnique({
            where: {
              coaId_periodId_date: {
                coaId: line.coaId,
                periodId: target.periodId,
                date: normalizedDate,
              },
            },
          });

          if (summary) {
            const newDebit = Math.max(0, Number(summary.debitTotal) - line.debitAmount);
            const newCredit = Math.max(0, Number(summary.creditTotal) - line.creditAmount);
            const newClosing = Number(summary.openingBalance) + newDebit - newCredit;

            await tx.generalLedgerSummary.update({
              where: {
                coaId_periodId_date: {
                  coaId: line.coaId,
                  periodId: target.periodId,
                  date: normalizedDate,
                },
              },
              data: {
                debitTotal: newDebit,
                creditTotal: newCredit,
                closingBalance: newClosing,
                transactionCount: { decrement: 1 },
              },
            });
          }

          // 2b. Reverse TrialBalance
          const tb = await tx.trialBalance.findUnique({
            where: { periodId_coaId: { periodId: target.periodId, coaId: line.coaId } },
          });

          if (tb) {
            const newPeriodDebit = Math.max(0, Number(tb.periodDebit) - line.debitAmount);
            const newPeriodCredit = Math.max(0, Number(tb.periodCredit) - line.creditAmount);
            const newEndingDebit = Number(tb.openingDebit) + newPeriodDebit;
            const newEndingCredit = Number(tb.openingCredit) + newPeriodCredit;

            await tx.trialBalance.update({
              where: { periodId_coaId: { periodId: target.periodId, coaId: line.coaId } },
              data: {
                periodDebit: newPeriodDebit,
                periodCredit: newPeriodCredit,
                endingDebit: newEndingDebit,
                endingCredit: newEndingCredit,
                ytdDebit: newEndingDebit,
                ytdCredit: newEndingCredit,
                calculatedAt: new Date(),
              },
            });
          }
        }

        // 2c. Mark Ledger as VOID
        const voidedLedger = await tx.ledger.update({
          where: { id: target.id },
          data: {
            status: "VOID",
            voidBy: userId,
            voidAt: new Date(),
            voidReason: voidReason.trim(),
          },
        });

        // 2d. If this is a Loan posting, revert Pinjaman status back to DRAFT
        if (target.referenceType === "JOURNAL" && target.referenceNumber?.startsWith("LOAN-")) {
          const loanShortId = target.referenceNumber.replace("LOAN-", "").toLowerCase();
          // Find the pinjaman whose id starts with loanShortId
          const pinjaman = await tx.pinjaman.findFirst({
            where: { id: { startsWith: loanShortId } },
          });
          if (pinjaman && pinjaman.status === "ACTIVE") {
            await tx.pinjaman.update({
              where: { id: pinjaman.id },
              data: { status: "DRAFT" },
            });
            ;(() => {})(`✅ Pinjaman ${pinjaman.id} dikembalikan ke status DRAFT`);
          }
        }

        return voidedLedger;
      });

      ;(() => {})(`🚫 Ledger VOIDED: ${target.ledgerNumber} by ${userId} | Reason: ${voidReason}`);

      return res.status(200).json({
        success: true,
        message: `Ledger ${target.ledgerNumber} berhasil dibatalkan`,
        data: result,
      });
    } catch (error) {
      console.error("Void Ledger Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
}

export default new LedgerController();
