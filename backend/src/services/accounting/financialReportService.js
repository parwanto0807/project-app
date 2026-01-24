import { prisma } from '../../config/db.js';

export const financialReportService = {
  /**
   * Get Income Statement Report
   * @param {Object} params
   * @param {Date} params.startDate
   * @param {Date} params.endDate
   * @param {string} params.salesOrderId (Optional)
   * @returns {Promise<Object>} Formatted Income Statement
   */
  getIncomeStatement: async ({ startDate, endDate, salesOrderId }) => {
    // 1. Define Account Types for Income Statement
    const REVENUE_TYPES = ['PENDAPATAN'];
    const COGS_TYPES = ['HPP'];
    const EXPENSE_TYPES = ['BEBAN'];
    const INCOME_STATEMENT_TYPES = [...REVENUE_TYPES, ...COGS_TYPES, ...EXPENSE_TYPES];

    // 2. Build Query Filters
    const whereCondition = {
      ledger: {
        transactionDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'POSTED' // Only Processed/Posted transactions
      },
      coa: {
        type: {
          in: INCOME_STATEMENT_TYPES
        }
      }
    };

    // Optional: Filter by Sales Order (Project)
    if (salesOrderId) {
      whereCondition.salesOrderId = salesOrderId;
    }

    // 3. Aggregate Ledger Lines by COA
    // Group by COA ID to get totals
    const aggregates = await prisma.ledgerLine.groupBy({
      by: ['coaId'],
      where: whereCondition,
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    // 4. Fetch COA Details
    const coaIds = aggregates.map(a => a.coaId);
    const accounts = await prisma.chartOfAccounts.findMany({
      where: { id: { in: coaIds } },
      select: {
        id: true,
        code: true,
        name: true,
        type: true
      }
    });

    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // 5. Structure the Data
    const reportData = {
      revenue: {
        accounts: [],
        total: 0
      },
      cogs: {
        accounts: [],
        total: 0
      },
      grossProfit: 0,
      expenses: {
        accounts: [],
        total: 0
      },
      netProfit: 0
    };

    // 6. Process Aggregates
    for (const agg of aggregates) {
      const account = accountMap.get(agg.coaId);
      if (!account) continue;

      const debit = Number(agg._sum.debitAmount || 0);
      const credit = Number(agg._sum.creditAmount || 0);
      let balance = 0;

      // Determine Balance based on Account Type
      // Revenue: Credit is positive
      // Expense/COGS: Debit is positive
      if (REVENUE_TYPES.includes(account.type)) {
        balance = credit - debit;
      } else {
        balance = debit - credit;
      }

      const formattedAccount = {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        amount: balance
      };

      if (REVENUE_TYPES.includes(account.type)) {
        reportData.revenue.accounts.push(formattedAccount);
        reportData.revenue.total += balance;
      } else if (COGS_TYPES.includes(account.type)) {
        reportData.cogs.accounts.push(formattedAccount);
        reportData.cogs.total += balance;
      } else if (EXPENSE_TYPES.includes(account.type)) {
        reportData.expenses.accounts.push(formattedAccount);
        reportData.expenses.total += balance;
      }
    }

    // 7. Calculate Profits
    reportData.grossProfit = reportData.revenue.total - reportData.cogs.total;
    reportData.netProfit = reportData.grossProfit - reportData.expenses.total;

    // Sort accounts by code
    reportData.revenue.accounts.sort((a, b) => a.code.localeCompare(b.code));
    reportData.cogs.accounts.sort((a, b) => a.code.localeCompare(b.code));
    reportData.expenses.accounts.sort((a, b) => a.code.localeCompare(b.code));

    return reportData;
  },

  /**
   * Get Balance Sheet Report
   * @param {Object} params
   * @param {Date} params.endDate (Snapshot Date)
   * @returns {Promise<Object>} Formatted Balance Sheet
   */
  getBalanceSheet: async ({ endDate }) => {
    const snapshotDate = new Date(endDate);
    snapshotDate.setHours(23, 59, 59, 999);

    const startOfYear = new Date(snapshotDate.getFullYear(), 0, 1);
    const endOfPrevYear = new Date(snapshotDate.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

    const ASSET_TYPES = ['ASET'];
    const LIABILITY_TYPES = ['LIABILITAS'];
    const EQUITY_TYPES = ['EKUITAS'];
    const REVENUE_TYPES = ['PENDAPATAN'];
    const COGS_TYPES = ['HPP'];
    const EXPENSE_TYPES = ['BEBAN'];

    // 1. Aggregate Balance Sheet Items (Assets, Liabilities, Equity)
    const bsAggregates = await prisma.ledgerLine.groupBy({
      by: ['coaId'],
      where: {
        ledger: {
          transactionDate: { lte: snapshotDate },
          status: 'POSTED'
        },
        coa: {
          type: { in: [...ASSET_TYPES, ...LIABILITY_TYPES, ...EQUITY_TYPES] }
        }
      },
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    // 2. Aggregate P&L for Retained Earnings (all time until end of previous year)
    const prevPnLAggregates = await prisma.ledgerLine.groupBy({
      by: ['coaId'],
      where: {
        ledger: {
          transactionDate: { lte: endOfPrevYear },
          status: 'POSTED'
        },
        coa: {
          type: { in: [...REVENUE_TYPES, ...COGS_TYPES, ...EXPENSE_TYPES] }
        }
      },
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    // 3. Aggregate P&L for Current Year Earnings (start of year until snapshot date)
    const currentPnLAggregates = await prisma.ledgerLine.groupBy({
      by: ['coaId'],
      where: {
        ledger: {
          transactionDate: { gte: startOfYear, lte: snapshotDate },
          status: 'POSTED'
        },
        coa: {
          type: { in: [...REVENUE_TYPES, ...COGS_TYPES, ...EXPENSE_TYPES] }
        }
      },
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    // 4. Fetch all relevant COA details
    const allCoaIds = [
      ...bsAggregates,
      ...prevPnLAggregates,
      ...currentPnLAggregates
    ].map(a => a.coaId);

    const accounts = await prisma.chartOfAccounts.findMany({
      where: { id: { in: [...new Set(allCoaIds)] } },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        normalBalance: true
      }
    });
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    const reportData = {
      assets: {
        currentAssets: { accounts: [], total: 0 },
        fixedAssets: { accounts: [], total: 0 },
        total: 0
      },
      liabilities: {
        currentLiabilities: { accounts: [], total: 0 },
        longTermLiabilities: { accounts: [], total: 0 },
        total: 0
      },
      equity: { 
        accounts: [], 
        total: 0,
        currentYearEarnings: 0,
        retainedEarnings: 0,
        totalEquity: 0
      },
      totalLiabilitiesAndEquity: 0,
      checks: { isBalanced: true, difference: 0 }
    };

    // 5. Calculate Retained Earnings
    for (const agg of prevPnLAggregates) {
      const account = accountMap.get(agg.coaId);
      if (!account) continue;
      const debit = Number(agg._sum.debitAmount || 0);
      const credit = Number(agg._sum.creditAmount || 0);
      
      if (REVENUE_TYPES.includes(account.type)) {
        reportData.equity.retainedEarnings += (credit - debit);
      } else {
        reportData.equity.retainedEarnings -= (debit - credit);
      }
    }

    // 6. Calculate Current Year Earnings
    for (const agg of currentPnLAggregates) {
      const account = accountMap.get(agg.coaId);
      if (!account) continue;
      const debit = Number(agg._sum.debitAmount || 0);
      const credit = Number(agg._sum.creditAmount || 0);
      
      if (REVENUE_TYPES.includes(account.type)) {
        reportData.equity.currentYearEarnings += (credit - debit);
      } else {
        reportData.equity.currentYearEarnings -= (debit - credit);
      }
    }

    // 7. Process Balance Sheet Accounts
    for (const agg of bsAggregates) {
      const account = accountMap.get(agg.coaId);
      if (!account) continue;

      const debit = Number(agg._sum.debitAmount || 0);
      const credit = Number(agg._sum.creditAmount || 0);
      let balance = 0;

      // Balance Calculation based on Normal Balance
      if (account.normalBalance === 'DEBIT') {
        balance = debit - credit;
      } else {
        balance = credit - debit;
      }

      const formattedAccount = {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        amount: balance
      };

      if (ASSET_TYPES.includes(account.type)) {
        if (account.code.startsWith('1-1')) {
          reportData.assets.currentAssets.accounts.push(formattedAccount);
          reportData.assets.currentAssets.total += balance;
        } else if (account.code.startsWith('1-2')) {
          reportData.assets.fixedAssets.accounts.push(formattedAccount);
          reportData.assets.fixedAssets.total += balance;
        } else {
          // Fallback if code doesn't match pattern, put in current
          reportData.assets.currentAssets.accounts.push(formattedAccount);
          reportData.assets.currentAssets.total += balance;
        }
        reportData.assets.total += balance;
      } else if (LIABILITY_TYPES.includes(account.type)) {
        if (account.code.startsWith('2-1')) {
          reportData.liabilities.currentLiabilities.accounts.push(formattedAccount);
          reportData.liabilities.currentLiabilities.total += balance;
        } else if (account.code.startsWith('2-2')) {
          reportData.liabilities.longTermLiabilities.accounts.push(formattedAccount);
          reportData.liabilities.longTermLiabilities.total += balance;
        } else {
          // Fallback
          reportData.liabilities.currentLiabilities.accounts.push(formattedAccount);
          reportData.liabilities.currentLiabilities.total += balance;
        }
        reportData.liabilities.total += balance;
      } else if (EQUITY_TYPES.includes(account.type)) {
        reportData.equity.accounts.push(formattedAccount);
        reportData.equity.total += balance;
      }
    }

    // 8. Final Totals
    reportData.equity.totalEquity = reportData.equity.total + reportData.equity.retainedEarnings + reportData.equity.currentYearEarnings;
    reportData.totalLiabilitiesAndEquity = reportData.liabilities.total + reportData.equity.totalEquity;

    // 9. Validation
    const diff = Math.abs(reportData.assets.total - reportData.totalLiabilitiesAndEquity);
    reportData.checks.difference = diff;
    reportData.checks.isBalanced = diff < 0.01; // Allow for micro-rounding

    // Sort accounts
    reportData.assets.currentAssets.accounts.sort((a, b) => a.code.localeCompare(b.code));
    reportData.assets.fixedAssets.accounts.sort((a, b) => a.code.localeCompare(b.code));
    reportData.liabilities.currentLiabilities.accounts.sort((a, b) => a.code.localeCompare(b.code));
    reportData.liabilities.longTermLiabilities.accounts.sort((a, b) => a.code.localeCompare(b.code));
    reportData.equity.accounts.sort((a, b) => a.code.localeCompare(b.code));

    return reportData;
  }
};
