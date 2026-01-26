import { prisma } from "../../config/db.js";
import { getJakartaStartOfDay, getJakartaEndOfDay } from "../../utils/dateUtils.js";

class GLSummaryController {
  /**
   * Get General Ledger Summaries with filters
   */
  async getAll(req, res) {
    try {
      const { 
        coaId, 
        periodId, 
        startDate, 
        endDate, 
        search,
        page = 1, 
        limit = 10 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};

      if (coaId) where.coaId = coaId;
      if (periodId) where.periodId = periodId;
      
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = getJakartaStartOfDay(startDate);
        if (endDate) where.date.lte = getJakartaEndOfDay(endDate);
      }

      if (search) {
        where.OR = [
          { coa: { name: { contains: search, mode: "insensitive" } } },
          { coa: { code: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.generalLedgerSummary.findMany({
          where,
          include: {
            coa: {
              select: {
                code: true,
                name: true,
                type: true
              }
            },
            period: {
              select: {
                periodName: true
              }
            }
          },
          orderBy: [
            { date: "desc" },
            { coa: { code: "asc" } }
          ],
          skip,
          take
        }),
        prisma.generalLedgerSummary.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / take)
        }
      });
    } catch (error) {
      console.error("Get GL Summary Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get Summary for a specific COA across dates
   */
  async getByCoa(req, res) {
    try {
      const { coaId } = req.params;
      const { startDate, endDate } = req.query;

      const where = { coaId };
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = getJakartaStartOfDay(startDate);
        if (endDate) where.date.lte = getJakartaEndOfDay(endDate);
      }

      const data = await prisma.generalLedgerSummary.findMany({
        where,
        orderBy: { date: "asc" },
        include: {
          coa: { select: { code: true, name: true } }
        }
      });

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Get GL Summary By COA Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get Grand Total with proper accounting calculation
   * Total Debit = Sum of all ASET accounts (code starts with 1)
   * Total Credit = Sum of LIABILITAS (code starts with 2) + EKUITAS (code starts with 3) + PENDAPATAN (code starts with 4)
   * Opening Balance = Sum of all EKUITAS opening balances (represents total initial capital)
   * Status = BALANCED if Total Debit = Total Credit
   */
  async getGrandTotal(req, res) {
    try {
      const { periodId, startDate, endDate } = req.query;

      const dateFilter = {};
      if (startDate || endDate) {
        if (startDate) dateFilter.gte = getJakartaStartOfDay(startDate);
        if (endDate) dateFilter.lte = getJakartaEndOfDay(endDate);
      }

      // Build where clause for GL Summary
      const where = {};
      if (periodId) where.periodId = periodId;
      if (Object.keys(dateFilter).length > 0) where.date = dateFilter;

      // Get all GL Summary data with COA information
      const summaries = await prisma.generalLedgerSummary.findMany({
        where,
        include: {
          coa: {
            select: {
              code: true,
              name: true,
              type: true
            }
          }
        }
      });

      // Calculate Total Debit (ASET accounts - code starts with 1)
      const totalDebit = summaries
        .filter(s => s.coa.code.startsWith('1'))
        .reduce((sum, item) => {
          const closing = Number(item.closingBalance) || 0;
          return sum + (closing > 0 ? closing : 0); // Only positive balances
        }, 0);

      // Calculate Total Credit (LIABILITAS + EKUITAS + PENDAPATAN - codes start with 2, 3, or 4)
      const totalCredit = summaries
        .filter(s => s.coa.code.startsWith('2') || s.coa.code.startsWith('3') || s.coa.code.startsWith('4'))
        .reduce((sum, item) => {
          const closing = Number(item.closingBalance) || 0;
          return sum + Math.abs(closing); // Use absolute value for credit accounts
        }, 0);

      // Calculate Opening Balance from ALL Equity accounts (code starts with 3)
      // This represents the total initial capital, not just one account
      const openingBalance = summaries
        .filter(s => s.coa.code.startsWith('3')) // All EKUITAS accounts
        .reduce((sum, item) => {
          const opening = Number(item.openingBalance) || 0;
          return sum + Math.abs(opening); // Use absolute value
        }, 0);

      // Calculate balance status
      const difference = Math.abs(totalDebit - totalCredit);
      const isBalanced = difference < 0.01; // Allow for rounding errors

      // Calculate totals from all summaries (for reference)
      const aggregatedTotals = summaries.reduce((acc, item) => {
        return {
          debit: acc.debit + (Number(item.debitTotal) || 0),
          credit: acc.credit + (Number(item.creditTotal) || 0),
          opening: acc.opening + (Number(item.openingBalance) || 0),
          closing: acc.closing + (Number(item.closingBalance) || 0)
        };
      }, { debit: 0, credit: 0, opening: 0, closing: 0 });

      return res.status(200).json({
        success: true,
        data: {
          // Proper accounting totals (Balance Sheet approach)
          totalDebit,      // Total ASET (closing balance)
          totalCredit,     // Total LIABILITAS + EKUITAS + PENDAPATAN (closing balance)
          openingBalance,  // Total initial capital from all Equity accounts
          isBalanced,
          difference,
          
          // Aggregated transaction totals (for reference)
          aggregatedTotals,
          
          // Metadata
          recordCount: summaries.length,
          calculatedAt: new Date()
        }
      });
    } catch (error) {
      console.error("Get Grand Total Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new GLSummaryController();
