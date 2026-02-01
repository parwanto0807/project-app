import { prisma } from "../../config/db.js";
import financialSummaryService from "../../services/accounting/financialSummaryService.js";
import { getJakartaStartOfDay, getJakartaEndOfDay } from "../../utils/dateUtils.js";

class CashOpnameController {
  // Get list of cash opnames
  async getOpnames(req, res) {
    try {
      const { periodId, coaId, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};
      if (coaId) where.coaId = coaId;

      const [opnames, total] = await Promise.all([
        prisma.cashOpname.findMany({
          where,
          include: {
            coa: true,
            ledger: true,
            createdBy: {
              select: { name: true }
            }
          },
          orderBy: { date: "desc" },
          skip,
          take,
        }),
        prisma.cashOpname.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: opnames,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get Cash Opnames Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }

  // Get current system balance for an account
  async getSystemBalance(req, res) {
    try {
      const { coaId, date } = req.query;
      if (!coaId || !date) {
        return res.status(400).json({ success: false, message: "coaId and date are required" });
      }

      // Find the period for this date
      const targetDate = new Date(date);
      const period = await prisma.accountingPeriod.findFirst({
        where: {
          startDate: { lte: targetDate },
          endDate: { gte: targetDate }
        }
      });

      if (!period) {
        return res.status(404).json({ success: false, message: "Accounting period not found for this date" });
      }

      // Get Trial Balance record
      const tb = await prisma.trialBalance.findUnique({
        where: {
          periodId_coaId: {
            periodId: period.id,
            coaId: coaId
          }
        },
        include: { coa: true }
      });

      // Calculate current balance (Opening + Period)
      // We assume normal balance logic
      let balance = 0;
      if (tb) {
        const debit = Number(tb.openingDebit) + Number(tb.periodDebit);
        const credit = Number(tb.openingCredit) + Number(tb.periodCredit);
        
        if (tb.coa.normalBalance === 'DEBIT') {
          balance = debit - credit;
        } else {
          balance = credit - debit;
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          systemAmount: balance,
          periodName: period.periodName,
          periodId: period.id,
          coaName: tb?.coa?.name || 'Unknown'
        }
      });
    } catch (error) {
      console.error("Get System Balance Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }

  // Create and Post Cash Opname
  async createOpname(req, res) {
    try {
      const { coaId, date, physicalAmount, description, status = 'POSTED' } = req.body;
      const userId = req.user?.id || 'system';

      if (!coaId || !date || physicalAmount === undefined) {
        return res.status(400).json({ success: false, message: "coaId, date, and physicalAmount are required" });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Get current system balance
        const targetDate = new Date(date);
        const period = await tx.accountingPeriod.findFirst({
          where: {
            startDate: { lte: targetDate },
            endDate: { gte: targetDate }
          }
        });

        if (!period) throw new Error("Accounting period not found for this date");

        const tb = await tx.trialBalance.findUnique({
          where: { periodId_coaId: { periodId: period.id, coaId } },
          include: { coa: true }
        });

        const debit = tb ? (Number(tb.openingDebit) + Number(tb.periodDebit)) : 0;
        const credit = tb ? (Number(tb.openingCredit) + Number(tb.periodCredit)) : 0;
        let systemAmount = 0;
        if (tb && tb.coa.normalBalance === 'DEBIT') {
          systemAmount = debit - credit;
        } else if (tb) {
          systemAmount = credit - debit;
        }

        const difference = Number(physicalAmount) - systemAmount;

        // 2. Generate Opname Number
        const count = await tx.cashOpname.count();
        const opnameNumber = `COP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

        // 3. If POSTED, create Ledger
        let ledgerId = null;
        if (status === 'POSTED' && Math.abs(difference) > 0.01) {
          // Find adjustment accounts
          const shortageKey = 'CASH_SHORTAGE_ACCOUNT';
          const overageKey = 'CASH_OVERAGE_ACCOUNT';
          
          const shortageSys = await tx.systemAccount.findUnique({ where: { key: shortageKey } });
          const overageSys = await tx.systemAccount.findUnique({ where: { key: overageKey } });

          if (difference < 0 && !shortageSys) throw new Error("System Account 'CASH_SHORTAGE_ACCOUNT' not mapped");
          if (difference > 0 && !overageSys) throw new Error("System Account 'CASH_OVERAGE_ACCOUNT' not mapped");

          const adjCoaId = difference < 0 ? shortageSys.coaId : overageSys.coaId;

          // Generate Ledger Number
          const ledgerCount = await tx.ledger.count();
          const ledgerNumber = `JV-COP-${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;

          const ledger = await tx.ledger.create({
            data: {
              ledgerNumber,
              referenceNumber: opnameNumber,
              referenceType: 'ADJUSTMENT',
              transactionDate: targetDate,
              postingDate: new Date(),
              description: description || `Cash Opname Adjustment: ${opnameNumber}`,
              periodId: period.id,
              status: 'POSTED',
              createdBy: userId,
              postedBy: userId,
              postedAt: new Date(),
              ledgerLines: {
                create: [
                  {
                    coaId: coaId,
                    debitAmount: difference > 0 ? Math.abs(difference) : 0,
                    creditAmount: difference < 0 ? Math.abs(difference) : 0,
                    localAmount: difference,
                    lineNumber: 1,
                    description: `Adjustment from Cash Opname ${opnameNumber}`
                  },
                  {
                    coaId: adjCoaId,
                    debitAmount: difference < 0 ? Math.abs(difference) : 0,
                    creditAmount: difference > 0 ? Math.abs(difference) : 0,
                    localAmount: -difference,
                    lineNumber: 2,
                    description: difference < 0 ? `Cash Shortage` : `Cash Overage`
                  }
                ]
              }
            }
          });

          ledgerId = ledger.id;

          // Update Trial Balance and GL Summary
          const lines = await tx.ledgerLine.findMany({ where: { ledgerId } });
          for (const line of lines) {
            await financialSummaryService.updateTrialBalance({
              periodId: period.id,
              coaId: line.coaId,
              debitAmount: line.debitAmount,
              creditAmount: line.creditAmount,
              tx
            });
            await financialSummaryService.updateGeneralLedgerSummary({
              coaId: line.coaId,
              periodId: period.id,
              date: targetDate,
              debitAmount: line.debitAmount,
              creditAmount: line.creditAmount,
              tx
            });
          }
        }

        // 4. Create Opname Record
        const cashOpname = await tx.cashOpname.create({
          data: {
            opnameNumber,
            date: targetDate,
            coaId,
            systemAmount,
            physicalAmount,
            difference,
            description,
            status,
            ledgerId,
            createdById: userId
          }
        });

        return cashOpname;
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Create Cash Opname Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
}

export default new CashOpnameController();
