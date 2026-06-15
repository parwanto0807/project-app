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
   * Total Debit = Sum of all debitTotal columns across all GL Summary records
   * Total Credit = Sum of all creditTotal columns across all GL Summary records
   * In a balanced system, Total Debit should equal Total Credit
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
              type: true,
              normalBalance: true
            }
          }
        }
      });

      // ✅ FIX: Calculate Total Debit & Credit properly by summing the transaction columns
      // In double-entry bookkeeping, Total Debit MUST equal Total Credit across ALL accounts
      const aggregatedTotals = summaries.reduce((acc, item) => {
        return {
          debit: acc.debit + (Number(item.debitTotal) || 0),
          credit: acc.credit + (Number(item.creditTotal) || 0),
          opening: acc.opening + (Number(item.openingBalance) || 0),
          closing: acc.closing + (Number(item.closingBalance) || 0)
        };
      }, { debit: 0, credit: 0, opening: 0, closing: 0 });

      // ✅ Proper: Use aggregated debit/credit totals
      const totalDebit = aggregatedTotals.debit;
      const totalCredit = aggregatedTotals.credit;

      // Calculate Opening Balance: sum of Net Balance for EKUITAS accounts only
      // (represents accumulated capital/equity as starting point)
      const openingBalance = summaries
        .filter(s => s.coa.type === 'EKUITAS')
        .reduce((sum, item) => {
          const opening = Number(item.openingBalance) || 0;
          // For CREDIT normal balance accounts, a positive opening means credit balance
          return sum + Math.abs(opening);
        }, 0);

      // ✅ Net Position per account type for summary insight
      const netByType = summaries.reduce((acc, item) => {
        const type = item.coa.type;
        const debit = Number(item.debitTotal) || 0;
        const credit = Number(item.creditTotal) || 0;
        const net = item.coa.normalBalance === 'DEBIT' ? (debit - credit) : (credit - debit);
        if (!acc[type]) acc[type] = 0;
        acc[type] += net;
        return acc;
      }, {});

      // Calculate balance status
      const difference = Math.abs(totalDebit - totalCredit);
      const isBalanced = difference < 0.01; // Allow for rounding errors

      return res.status(200).json({
        success: true,
        data: {
          // ✅ Correct accounting totals: sum of all debit/credit transactions
          totalDebit,
          totalCredit,
          openingBalance,
          isBalanced,
          difference,

          // Net position breakdown by account type
          netByType,
          
          // Aggregated transaction totals
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
