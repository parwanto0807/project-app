import { prisma } from "../../config/db.js";

class TrialBalanceController {
  /**
   * Get Trial Balance by Period
   */
  async getTrialBalance(req, res) {
    try {
      const { periodId, search, coaType } = req.query;

      if (!periodId) {
        return res.status(400).json({
          success: false,
          message: "Period ID is required",
        });
      }

      // 1. Validate Period
      const period = await prisma.accountingPeriod.findUnique({
        where: { id: periodId },
      });

      if (!period) {
        return res.status(404).json({
          success: false,
          message: "Accounting period not found",
        });
      }

      // 2. Build Where Clause
      const where = {
        periodId: periodId,
      };

      if (coaType) {
        where.coa = {
          type: coaType,
        };
      }

      if (search) {
        where.coa = {
          ...where.coa,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        };
      }

      // 3. Fetch Trial Balance Records
      const trialBalanceRecords = await prisma.trialBalance.findMany({
        where,
        include: {
          coa: true,
        },
        orderBy: {
          coa: {
            code: "asc",
          },
        },
      });

      // 4. Transform records to ensure ending balances are calculated if missing
      const transformedRecords = trialBalanceRecords.map(record => {
        const openingDebit = Number(record.openingDebit) || 0;
        const openingCredit = Number(record.openingCredit) || 0;
        const periodDebit = Number(record.periodDebit) || 0;
        const periodCredit = Number(record.periodCredit) || 0;
        
        // If database version is 0 but opening exists, calculate on the fly
        let endingDebit = Number(record.endingDebit) || 0;
        let endingCredit = Number(record.endingCredit) || 0;
        
        if (endingDebit === 0 && endingCredit === 0 && (openingDebit !== 0 || openingCredit !== 0)) {
          // Calculate based on Normal Balance
          const netOpening = openingDebit - openingCredit;
          const netPeriod = periodDebit - periodCredit;
          const totalNet = netOpening + netPeriod;
          
          if (record.coa.normalBalance === 'DEBIT') {
            endingDebit = totalNet > 0 ? totalNet : 0;
            endingCredit = totalNet < 0 ? Math.abs(totalNet) : 0;
          } else {
            endingCredit = totalNet < 0 ? Math.abs(totalNet) : 0;
            endingDebit = totalNet > 0 ? totalNet : 0;
            // Wait, for credit accounts: Net = Credit - Debit
            const netOpeningCr = openingCredit - openingDebit;
            const netPeriodCr = periodCredit - periodDebit;
            const totalNetCr = netOpeningCr + netPeriodCr;
            endingCredit = totalNetCr > 0 ? totalNetCr : 0;
            endingDebit = totalNetCr < 0 ? Math.abs(totalNetCr) : 0;
          }
        }

        return {
          ...record,
          openingDebit,
          openingCredit,
          periodDebit,
          periodCredit,
          endingDebit,
          endingCredit
        };
      });

      // 5. Calculate Totals
      const totals = transformedRecords.reduce(
        (acc, record) => {
          acc.openingDebit += record.openingDebit;
          acc.openingCredit += record.openingCredit;
          acc.periodDebit += record.periodDebit;
          acc.periodCredit += record.periodCredit;
          acc.endingDebit += record.endingDebit;
          acc.endingCredit += record.endingCredit;
          return acc;
        },
        {
          openingDebit: 0,
          openingCredit: 0,
          periodDebit: 0,
          periodCredit: 0,
          endingDebit: 0,
          endingCredit: 0,
        }
      );

      return res.status(200).json({
        success: true,
        data: transformedRecords,
        totals,
        period,
      });
    } catch (error) {
      console.error("Get Trial Balance Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }

  /**
   * Recalculate Trial Balance for a period
   * (Optional: useful if data becomes out of sync)
   */
  async recalculate(req, res) {
    try {
      const { periodId } = req.body;

      if (!periodId) {
        return res.status(400).json({ success: false, message: "Period ID is required" });
      }

      // This logic would involve scanning all LedgerLines for the period
      // and rebuilding the TrialBalance table. 
      // For now, return a placeholder or implement if needed.
      
      return res.status(200).json({
        success: true,
        message: "Recalculation started (Placeholder)",
      });
    } catch (error) {
      console.error("Recalculate Trial Balance Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new TrialBalanceController();
