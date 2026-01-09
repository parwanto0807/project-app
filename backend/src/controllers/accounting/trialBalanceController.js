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

      // 4. Calculate Totals
      const totals = trialBalanceRecords.reduce(
        (acc, record) => {
          acc.openingDebit += record.openingDebit || 0;
          acc.openingCredit += record.openingCredit || 0;
          acc.periodDebit += record.periodDebit || 0;
          acc.periodCredit += record.periodCredit || 0;
          acc.endingDebit += record.endingDebit || 0;
          acc.endingCredit += record.endingCredit || 0;
          acc.ytdDebit += record.ytdDebit || 0;
          acc.ytdCredit += record.ytdCredit || 0;
          return acc;
        },
        {
          openingDebit: 0,
          openingCredit: 0,
          periodDebit: 0,
          periodCredit: 0,
          endingDebit: 0,
          endingCredit: 0,
          ytdDebit: 0,
          ytdCredit: 0,
        }
      );

      return res.status(200).json({
        success: true,
        data: trialBalanceRecords,
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
