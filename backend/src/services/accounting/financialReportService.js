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
  },

  /**
   * Get Cash Flow Report (Direct Method)
   * @param {Object} params
   * @param {Date} params.startDate
   * @param {Date} params.endDate
   * @returns {Promise<Object>} Formatted Cash Flow Statement
   */
  getCashFlowReport: async ({ startDate, endDate }) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 1. Identify Cash & Bank accounts (Assets that are reconcilable or marked as cash/bank)
    const cashAccounts = await prisma.chartOfAccounts.findMany({
      where: {
        type: 'ASET',
        OR: [
          { isReconcilable: true },
          { code: { startsWith: '1-11' } }, // Typical code for Cash & Bank
          { name: { contains: 'Kas', mode: 'insensitive' } },
          { name: { contains: 'Bank', mode: 'insensitive' } },
          { name: { contains: 'Petty', mode: 'insensitive' } }
        ]
      },
      select: { id: true, code: true, name: true }
    });

    const cashAccountIds = cashAccounts.map(a => a.id);

    // 2. Calculate Beginning Balance (Sum of all posted ledger lines before startDate)
    const beginningBalanceAgg = await prisma.ledgerLine.aggregate({
      where: {
        coaId: { in: cashAccountIds },
        ledger: {
          transactionDate: { lt: start },
          status: 'POSTED'
        }
      },
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    const beginningBalance = Number(beginningBalanceAgg._sum.debitAmount || 0) - Number(beginningBalanceAgg._sum.creditAmount || 0);

    // 3. Get all Ledger IDs involving cash/bank within range
    const cashLedgerLines = await prisma.ledgerLine.findMany({
      where: {
        coaId: { in: cashAccountIds },
        ledger: {
          transactionDate: { gte: start, lte: end },
          status: 'POSTED'
        }
      },
      include: {
        ledger: {
          include: {
            ledgerLines: {
              include: {
                coa: true
              }
            }
          }
        }
      }
    });

    // 4. Categorize Transactions
    const reportData = {
      operating: {
        in: { accounts: [], total: 0 },
        out: { accounts: [], total: 0 },
        net: 0,
        total: 0 // Keep total for backward compatibility if needed, but net is preferred
      },
      investing: { accounts: [], total: 0 },
      financing: { accounts: [], total: 0 },
      beginningBalance,
      netChange: 0,
      endingBalance: 0
    };

    const addToCategory = (category, amount, coa, isReceipt) => {
      // For Operating, we split into IN and OUT
      if (category === 'operating') {
        const target = isReceipt ? reportData.operating.in : reportData.operating.out;
        const existing = target.accounts.find(a => a.id === coa.id);
        if (existing) {
          existing.amount += amount;
        } else {
          target.accounts.push({
            id: coa.id,
            code: coa.code,
            name: coa.name,
            amount: amount,
            isReceipt // helpful tag
          });
        }
        target.total += amount;
        // Also update the main total for net calc
        // Receipts are positive, Payments are negative in net calc
        // But here 'amount' is absolute.
        // We will calc net later.
      } else {
        // Investing and Financing remain flat as requested/simplified
        const existing = reportData[category].accounts.find(a => a.id === coa.id);
        const taggedAmount = isReceipt ? amount : -amount;
        
        if (existing) {
          existing.amount += taggedAmount;
        } else {
          reportData[category].accounts.push({
            id: coa.id,
            code: coa.code,
            name: coa.name,
            amount: taggedAmount
          });
        }
        reportData[category].total += taggedAmount;
      }
    };

    // Track processed ledgers to avoid double counting if a single ledger has multiple cash lines
    const processedLedgerIds = new Set();

    for (const cashLine of cashLedgerLines) {
      const ledger = cashLine.ledger;
      if (processedLedgerIds.has(ledger.id)) continue;
      processedLedgerIds.add(ledger.id);

      // Check if this is an internal transfer (Cash to Cash)
      const allLines = ledger.ledgerLines;
      const allAccountIds = allLines.map(l => l.coaId);
      const areAllCash = allAccountIds.every(id => cashAccountIds.includes(id));
      
      if (areAllCash) {
        // This is a transfer between Cash/Bank accounts. 
        // Net effect on total cash is 0. Ignore for Direct Method Cash Flow.
        continue;
      }

      // Calculate the net cash impact of this whole ledger
      let netCashImpact = 0;
      allLines.filter(l => cashAccountIds.includes(l.coaId)).forEach(cl => {
        netCashImpact += (Number(cl.debitAmount) - Number(cl.creditAmount));
      });

      if (netCashImpact === 0) continue;

      // CRITICAL FIX: Check if this is an Opening Balance transaction (Saldo Awal)
      // If so, it should be treated as Beginning Balance, NOT a flow in the period.
      const desc = ledger.description ? ledger.description.toLowerCase() : '';
      const isOpeningBalance = desc.includes('saldo awal') || desc.includes('opening balance') || desc.includes('saldo opening');
      
      if (isOpeningBalance) {
        reportData.beginningBalance += netCashImpact;
        continue; 
      }

      const isReceipt = netCashImpact > 0;
      const absoluteAmount = Math.abs(netCashImpact);

      // Identify major counterparty (non-cash)
      let counterparties = allLines.filter(l => !cashAccountIds.includes(l.coaId));
      if (counterparties.length === 0) continue;

      // IMPROVED LOGIC: Prioritize lines on the OPPOSITE side
      // If Cash Inflow (Dr), look for Credits.
      // If Cash Outflow (Cr), look for Debits.
      const primaryCounterparties = counterparties.filter(l => {
          if (isReceipt) {
              return Number(l.creditAmount) > 0;
          } else {
              return Number(l.debitAmount) > 0;
          }
      });

      // If matches found on opposite side, use them. Otherwise fallback to any non-cash (rare adjustment cases)
      const candidates = primaryCounterparties.length > 0 ? primaryCounterparties : counterparties;

      // Pick expected candidate with largest value
      candidates.sort((a,b) => {
          const valA = isReceipt ? Number(a.creditAmount) : Number(a.debitAmount);
          const valB = isReceipt ? Number(b.creditAmount) : Number(b.debitAmount);
          return valB - valA;
      });

      const mainCP = candidates[0].coa;
      let cfCategory = 'operating';

      // Advanced Fallback Logic
      if (mainCP.cashflowType === 'INVESTING') {
        cfCategory = 'investing';
      } else if (mainCP.cashflowType === 'FINANCING') {
        cfCategory = 'financing';
      } else if (mainCP.cashflowType === 'OPERATING') {
        cfCategory = 'operating';
      } else {
        // Automatic mapping based on Account Type
        if (mainCP.type === 'EKUITAS') {
          cfCategory = 'financing';
        } else if (mainCP.type === 'LIABILITAS') {
          // Typically long term liabilities are financing, short term are operating
          // For simplicity, if it's explicitly Liabilitas but no CF type, check code
          if (mainCP.code.startsWith('2-2')) { // Typically Long Term
            cfCategory = 'financing';
          } else {
            cfCategory = 'operating';
          }
        } else if (mainCP.type === 'ASET') {
          // Non-cash Asset. If code starts with 1-2 (typically Fixed Assets)
          if (mainCP.code.startsWith('1-2')) {
            cfCategory = 'investing';
          } else {
            cfCategory = 'operating';
          }
        }
      }

      addToCategory(cfCategory, absoluteAmount, mainCP, isReceipt);
    }

    // 5. Final Calculations
    reportData.operating.net = reportData.operating.in.total - reportData.operating.out.total;
    // For flat categories (investing/financing), total is already net (signed sum)
    
    reportData.netChange = reportData.operating.net + reportData.investing.total + reportData.financing.total;
    reportData.endingBalance = reportData.beginningBalance + reportData.netChange;

    // Sort accounts within categories
    const sortFn = (a, b) => a.code.localeCompare(b.code);
    reportData.operating.in.accounts.sort(sortFn);
    reportData.operating.out.accounts.sort(sortFn);
    reportData.investing.accounts.sort(sortFn);
    reportData.financing.accounts.sort(sortFn);

    return reportData;
  }
};
