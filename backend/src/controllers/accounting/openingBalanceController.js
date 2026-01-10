import { prisma } from "../../config/db.js";

class OpeningBalanceController {
  /**
   * Get all Opening Balances
   */
  async getAll(req, res) {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = search 
        ? { description: { contains: search, mode: "insensitive" } }
        : {};

      const [data, total] = await Promise.all([
        prisma.openingBalance.findMany({
          where,
          include: {
            details: true,
            _count: {
              select: { details: true }
            }
          },
          orderBy: { asOfDate: "desc" },
          skip,
          take: parseInt(limit)
        }),
        prisma.openingBalance.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error("Get All Opening Balance Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get Opening Balance by ID with details
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await prisma.openingBalance.findUnique({
        where: { id },
        include: {
          details: {
            include: {
              account: {
                select: {
                  code: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!data) {
        return res.status(404).json({ success: false, message: "Opening Balance not found" });
      }

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Get Opening Balance By ID Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Create Opening Balance
   */
  async create(req, res) {
    try {
      const { asOfDate, description, details } = req.body;

      // details is an array of { accountId, debit, credit }
      const openingBalance = await prisma.openingBalance.create({
        data: {
          asOfDate: new Date(asOfDate),
          description,
          details: {
            create: details.map(d => ({
              accountId: d.accountId,
              debit: parseFloat(d.debit) || 0,
              credit: parseFloat(d.credit) || 0
            }))
          }
        },
        include: { details: true }
      });

      return res.status(201).json({
        success: true,
        message: "Opening Balance created successfully",
        data: openingBalance
      });
    } catch (error) {
      console.error("Create Opening Balance Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update Opening Balance
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { asOfDate, description, details } = req.body;

      const existing = await prisma.openingBalance.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ success: false, message: "Not found" });
      if (existing.isPosted) return res.status(400).json({ success: false, message: "Cannot edit posted opening balance" });

      const updated = await prisma.$transaction(async (tx) => {
        // Delete old details
        await tx.openingBalanceDetail.deleteMany({ where: { openingBalanceId: id } });

        // Update main and create new details
        return await tx.openingBalance.update({
          where: { id },
          data: {
            asOfDate: asOfDate ? new Date(asOfDate) : undefined,
            description,
            details: details ? {
              create: details.map(d => ({
                accountId: d.accountId,
                debit: parseFloat(d.debit) || 0,
                credit: parseFloat(d.credit) || 0
              }))
            } : undefined
          },
          include: { details: true }
        });
      });

      return res.status(200).json({
        success: true,
        message: "Opening Balance updated successfully",
        data: updated
      });
    } catch (error) {
      console.error("Update Opening Balance Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Post Opening Balance to Ledger/Trial Balance
   */
  async post(req, res) {
    try {
      const { id } = req.params;
      const ob = await prisma.openingBalance.findUnique({
        where: { id },
        include: { details: true }
      });

      if (!ob) return res.status(404).json({ success: false, message: "Not found" });
      if (ob.isPosted) return res.status(400).json({ success: false, message: "Already posted" });

      // Identify Period
      const period = await prisma.accountingPeriod.findFirst({
        where: {
          startDate: { lte: ob.asOfDate },
          endDate: { gte: ob.asOfDate },
          isClosed: false
        }
      });

      if (!period) return res.status(400).json({ success: false, message: "No open accounting period found for this date" });

      // Generate Ledger Number for Opening Balance
      // Using JV-OB (Journal Voucher - Opening Balance) as per accounting standards
      const counter = await prisma.counter.upsert({
        where: { name: "OPENING_BALANCE" },
        update: { lastNumber: { increment: 1 } },
        create: { name: "OPENING_BALANCE", lastNumber: 1 }
      });
      const ledgerNumber = `JV-OB-${String(counter.lastNumber).padStart(6, "0")}`;

      await prisma.$transaction(async (tx) => {
        // 1. Create Ledger Entry
        const ledger = await tx.ledger.create({
          data: {
            ledgerNumber,
            referenceNumber: `OB-${ob.id.substring(0, 8)}`,
            referenceType: "JOURNAL",
            transactionDate: ob.asOfDate,
            postingDate: new Date(),
            description: `Opening Balance: ${ob.description || "Initial Balances"}`,
            notes: "Auto-generated from Opening Balance posting",
            periodId: period.id,
            status: "POSTED",
            currency: "IDR",
            exchangeRate: 1.0,
            createdBy: req.user?.id || "system",
            postedBy: req.user?.id || "system",
            postedAt: new Date()
          }
        });

        // 2. Create Ledger Lines for each detail
        let lineNumber = 1;
        for (const detail of ob.details) {
          await tx.ledgerLine.create({
            data: {
              ledgerId: ledger.id,
              coaId: detail.accountId,
              debitAmount: detail.debit,
              creditAmount: detail.credit,
              currency: "IDR",
              localAmount: detail.debit > 0 ? detail.debit : detail.credit,
              exchangeRate: 1.0,
              description: `Opening Balance - ${ob.description || ""}`,
              reference: `OB-${ob.id.substring(0, 8)}`,
              lineNumber: lineNumber++,
              reconciliationStatus: "UNRECONCILED"
            }
          });
        }

        // 3. Mark Opening Balance as posted
        await tx.openingBalance.update({
          where: { id },
          data: { isPosted: true, postedAt: new Date() }
        });

        // 4. Update Trial Balance for each detail
        for (const detail of ob.details) {
          const tb = await tx.trialBalance.findUnique({
            where: {
              periodId_coaId: {
                periodId: period.id,
                coaId: detail.accountId
              }
            }
          });

          if (tb) {
            await tx.trialBalance.update({
              where: { id: tb.id },
              data: {
                openingDebit: { increment: detail.debit },
                openingCredit: { increment: detail.credit },
                endingDebit: { increment: detail.debit },
                endingCredit: { increment: detail.credit },
                ytdDebit: { increment: detail.debit },
                ytdCredit: { increment: detail.credit },
                calculatedAt: new Date()
              }
            });
          } else {
            await tx.trialBalance.create({
              data: {
                periodId: period.id,
                coaId: detail.accountId,
                openingDebit: detail.debit,
                openingCredit: detail.credit,
                periodDebit: 0,
                periodCredit: 0,
                endingDebit: detail.debit,
                endingCredit: detail.credit,
                ytdDebit: detail.debit,
                ytdCredit: detail.credit,
                calculatedAt: new Date()
              }
            });
          }
        }

        // 5. Update GeneralLedgerSummary for daily summary
        const summaryDate = new Date(ob.asOfDate);
        summaryDate.setHours(0, 0, 0, 0); // Normalize to start of day

        for (const detail of ob.details) {
          const existingSummary = await tx.generalLedgerSummary.findUnique({
            where: {
              coaId_periodId_date: {
                coaId: detail.accountId,
                periodId: period.id,
                date: summaryDate
              }
            }
          });

          const debitAmount = Number(detail.debit) || 0;
          const creditAmount = Number(detail.credit) || 0;
          const netAmount = debitAmount - creditAmount;

          if (existingSummary) {
            // Update existing summary
            await tx.generalLedgerSummary.update({
              where: { id: existingSummary.id },
              data: {
                openingBalance: { increment: netAmount },
                debitTotal: { increment: debitAmount },
                creditTotal: { increment: creditAmount },
                closingBalance: { increment: netAmount },
                transactionCount: { increment: 1 }
              }
            });
          } else {
            // Get opening balance from previous day
            const previousSummary = await tx.generalLedgerSummary.findFirst({
              where: {
                coaId: detail.accountId,
                periodId: period.id,
                date: { lt: summaryDate }
              },
              orderBy: { date: 'desc' }
            });

            // Opening balance = previous day's closing balance (NOT previous + netAmount)
            const previousClosing = previousSummary ? Number(previousSummary.closingBalance) : 0;
            const newOpening = previousClosing;
            
            // Closing balance = opening + debit - credit
            const debitAmount = Number(detail.debit) || 0;
            const creditAmount = Number(detail.credit) || 0;
            const newClosing = newOpening + debitAmount - creditAmount;

            // Create new summary
            await tx.generalLedgerSummary.create({
              data: {
                coaId: detail.accountId,
                periodId: period.id,
                date: summaryDate,
                openingBalance: newOpening,
                debitTotal: debitAmount,
                creditTotal: creditAmount,
                closingBalance: newClosing,
                transactionCount: 1,
                currency: "IDR"
              }
            });

            // Update all future dates' balances
            const futureSummaries = await tx.generalLedgerSummary.findMany({
              where: {
                coaId: detail.accountId,
                periodId: period.id,
                date: { gt: summaryDate }
              },
              orderBy: { date: 'asc' }
            });

            let runningBalance = newClosing;
            for (const futureSummary of futureSummaries) {
              const futureOpening = runningBalance;
              const futureClosing = futureOpening + Number(futureSummary.debitTotal) - Number(futureSummary.creditTotal);
              
              await tx.generalLedgerSummary.update({
                where: { id: futureSummary.id },
                data: {
                  openingBalance: futureOpening,
                  closingBalance: futureClosing
                }
              });

              runningBalance = futureClosing;
            }
          }
        }
      });

      return res.status(200).json({ 
        success: true, 
        message: "Opening Balance posted successfully to Ledger, Trial Balance, and Summary",
        ledgerNumber 
      });
    } catch (error) {
      console.error("Post Opening Balance Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete Opening Balance
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const ob = await prisma.openingBalance.findUnique({ where: { id } });
      if (!ob) return res.status(404).json({ success: false, message: "Not found" });
      if (ob.isPosted) return res.status(400).json({ success: false, message: "Cannot delete posted opening balance" });

      // Delete in transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // First, delete all related details
        await tx.openingBalanceDetail.deleteMany({
          where: { openingBalanceId: id }
        });

        // Then delete the opening balance header
        await tx.openingBalance.delete({ where: { id } });
      });

      return res.status(200).json({ success: true, message: "Opening Balance deleted" });
    } catch (error) {
      console.error("Delete Opening Balance Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new OpeningBalanceController();
