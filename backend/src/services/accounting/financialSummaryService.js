import { prisma } from '../../config/db.js';

/**
 * Service untuk Update Financial Summaries
 * Digunakan setelah posting ledger untuk update Trial Balance dan GL Summary
 */

/**
 * Update Trial Balance untuk periode tertentu
 * Dipanggil setelah posting ledger
 * 
 * @param {Object} params
 * @param {string} params.periodId - Accounting period ID
 * @param {string} params.coaId - Chart of Account ID
 * @param {number} params.debitAmount - Debit amount
 * @param {number} params.creditAmount - Credit amount
 * @param {Object} params.tx - Prisma transaction object (optional)
 */
export async function updateTrialBalance({ periodId, coaId, debitAmount, creditAmount, tx }) {
  const prismaClient = tx || prisma;

  // Get or create trial balance record
  const existing = await prismaClient.trialBalance.findUnique({
    where: {
      periodId_coaId: {
        periodId,
        coaId
      }
    }
  });

  if (existing) {
    // Update existing record
    await prismaClient.trialBalance.update({
      where: {
        periodId_coaId: {
          periodId,
          coaId
        }
      },
      data: {
        periodDebit: { increment: debitAmount },
        periodCredit: { increment: creditAmount },
        endingDebit: { increment: debitAmount },
        endingCredit: { increment: creditAmount },
        ytdDebit: { increment: debitAmount },
        ytdCredit: { increment: creditAmount },
        calculatedAt: new Date()
      }
    });
  } else {
    // Create new record
    // Get opening balance from previous period
    let openingDebit = 0;
    let openingCredit = 0;

    const previousPeriod = await prismaClient.accountingPeriod.findFirst({
        where: { endDate: { lt: new Date() }, isClosed: true }, // Find closed period before this one
        orderBy: { endDate: 'desc' },
        take: 1
    });

    if (previousPeriod) {
        const prevTB = await prismaClient.trialBalance.findUnique({
             where: { periodId_coaId: { periodId: previousPeriod.id, coaId } }
        });
        if (prevTB) {
            openingDebit = Number(prevTB.endingDebit);
            openingCredit = Number(prevTB.endingCredit);
        }
    }

    const endingDebit = openingDebit + debitAmount;
    const endingCredit = openingCredit + creditAmount;

    let finalEndingDebit = 0;
    let finalEndingCredit = 0;
    
    // Normal Balance Logic for Ending
    const coa = await prismaClient.chartOfAccounts.findUnique({ where: { id: coaId } });
    const netDebit = endingDebit - endingCredit;

    if (coa && coa.normalBalance === 'DEBIT') {
         if (netDebit >= 0) {
             finalEndingDebit = netDebit;
         } else {
             finalEndingCredit = Math.abs(netDebit);
         }
    } else {
         if (netDebit <= 0) {
             finalEndingCredit = Math.abs(netDebit);
         } else {
             finalEndingDebit = netDebit;
         }
    }

    await prismaClient.trialBalance.create({
      data: {
        periodId,
        coaId,
        openingDebit,
        openingCredit,
        periodDebit: debitAmount,
        periodCredit: creditAmount,
        endingDebit: finalEndingDebit || endingDebit, // Fallback if simple logic preferred
        endingCredit: finalEndingCredit || endingCredit,
        ytdDebit: debitAmount, // Note: YTD should ideally include YTD from prev, but keeping simple for now
        ytdCredit: creditAmount,
        currency: 'IDR',
        calculatedAt: new Date()
      }
    });
  }
}
/**
 * Update General Ledger Summary (daily summary)
 * Dipanggil setelah posting ledger
 * 
 * @param {Object} params
 * @param {string} params.coaId - Chart of Account ID
 * @param {string} params.periodId - Accounting period ID
 * @param {Date} params.date - Transaction date
 * @param {number} params.debitAmount - Debit amount
 * @param {number} params.creditAmount - Credit amount
 * @param {Object} params.tx - Prisma transaction object (optional)
 */
export async function updateGeneralLedgerSummary({ coaId, periodId, date, debitAmount, creditAmount, tx }) {
  const prismaClient = tx || prisma;

  // Normalize date to start of day
  const summaryDate = new Date(date);
  summaryDate.setHours(0, 0, 0, 0);

  // Get or create GL summary record
  const existing = await prismaClient.generalLedgerSummary.findUnique({
    where: {
      coaId_periodId_date: {
        coaId,
        periodId,
        date: summaryDate
      }
    }
  });

  if (existing) {
    // Update existing record
    const netChange = debitAmount - creditAmount;
    const newDebitTotal = Number(existing.debitTotal) + debitAmount;
    const newCreditTotal = Number(existing.creditTotal) + creditAmount;
    const newClosingBalance = Number(existing.openingBalance) + newDebitTotal - newCreditTotal;
    
    await prismaClient.generalLedgerSummary.update({
      where: {
        coaId_periodId_date: {
          coaId,
          periodId,
          date: summaryDate
        }
      },
      data: {
        debitTotal: newDebitTotal,
        creditTotal: newCreditTotal,
        closingBalance: newClosingBalance,
        transactionCount: { increment: 1 }
      }
    });
  } else {
    // Create new record
    // Get opening balance from previous day or period start
    const openingBalance = await calculateOpeningBalance(coaId, periodId, summaryDate, prismaClient);
    const netChange = debitAmount - creditAmount;

    await prismaClient.generalLedgerSummary.create({
      data: {
        coaId,
        periodId,
        date: summaryDate,
        openingBalance,
        debitTotal: debitAmount,
        creditTotal: creditAmount,
        closingBalance: openingBalance + netChange,
        transactionCount: 1,
        currency: 'IDR'
      }
    });
  }
}

/**
 * Helper: Calculate opening balance for a specific date
 * Gets closing balance from the most recent GL Summary record BEFORE this date,
 * searching ACROSS ALL PERIODS so that balances carry forward correctly.
 */
async function calculateOpeningBalance(coaId, periodId, date, prismaClient) {
  // Get the day before
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);

  // ✅ FIX: Search across ALL periods (remove periodId filter)
  // This ensures balance is carried forward from previous periods correctly
  const previousSummary = await prismaClient.generalLedgerSummary.findFirst({
    where: {
      coaId,
      // No periodId filter here — allow cross-period carry-forward
      date: { lte: previousDay }
    },
    orderBy: {
      date: 'desc'
    }
  });

  if (previousSummary) {
    return Number(previousSummary.closingBalance);
  }

  // No previous record at all — this is the very first transaction for this COA
  return 0;
}

/**
 * Batch recalculate Trial Balance for a specific accounting period.
 * - Calculates opening balance from ALL posted lines BEFORE this period (cross-period carry-forward)
 * - Includes accounts with carry-forward opening balances even if no transactions in current period
 * - Produces a properly balanced Trial Balance
 *
 * @param {string} periodId - Accounting period ID
 */
export async function recalculateTrialBalance(periodId) {
  const period = await prisma.accountingPeriod.findUnique({
    where: { id: periodId }
  });

  if (!period) {
    throw new Error('Accounting period not found');
  }

  // Step 1: Get all posted ledger lines IN this period
  const periodLines = await prisma.ledgerLine.findMany({
    where: { ledger: { periodId, status: 'POSTED' } },
    select: { coaId: true, debitAmount: true, creditAmount: true }
  });

  // Group period activity by COA
  const periodTotals = new Map();
  for (const l of periodLines) {
    if (!periodTotals.has(l.coaId)) periodTotals.set(l.coaId, { debit: 0, credit: 0 });
    const t = periodTotals.get(l.coaId);
    t.debit += Number(l.debitAmount);
    t.credit += Number(l.creditAmount);
  }

  // Step 2: Get all posted ledger lines BEFORE this period (for opening balances)
  const priorLines = await prisma.ledgerLine.findMany({
    where: { ledger: { status: 'POSTED', transactionDate: { lt: period.startDate } } },
    select: { coaId: true, debitAmount: true, creditAmount: true }
  });

  // Group prior activity by COA
  const priorTotals = new Map();
  for (const l of priorLines) {
    if (!priorTotals.has(l.coaId)) priorTotals.set(l.coaId, { debit: 0, credit: 0 });
    const t = priorTotals.get(l.coaId);
    t.debit += Number(l.debitAmount);
    t.credit += Number(l.creditAmount);
  }

  // Step 3: Union of all COA IDs (both current period AND prior periods with carry-forward balance)
  const allCoaIds = new Set([...periodTotals.keys(), ...priorTotals.keys()]);

  let accountsUpdated = 0;

  for (const coaId of allCoaIds) {
    const prior = priorTotals.get(coaId) || { debit: 0, credit: 0 };
    const period_ = periodTotals.get(coaId) || { debit: 0, credit: 0 };

    // Opening net (positive = debit side, negative = credit side)
    const openingNet = prior.debit - prior.credit;
    const openingDebit = openingNet > 0 ? openingNet : 0;
    const openingCredit = openingNet < 0 ? Math.abs(openingNet) : 0;

    // Ending = opening + period activity
    const endingNet = openingNet + period_.debit - period_.credit;
    const endingDebit = endingNet > 0 ? endingNet : 0;
    const endingCredit = endingNet < 0 ? Math.abs(endingNet) : 0;

    await prisma.trialBalance.upsert({
      where: { periodId_coaId: { periodId, coaId } },
      update: {
        openingDebit,
        openingCredit,
        periodDebit: period_.debit,
        periodCredit: period_.credit,
        endingDebit,
        endingCredit,
        ytdDebit: endingDebit,
        ytdCredit: endingCredit,
        calculatedAt: new Date()
      },
      create: {
        periodId,
        coaId,
        openingDebit,
        openingCredit,
        periodDebit: period_.debit,
        periodCredit: period_.credit,
        endingDebit,
        endingCredit,
        ytdDebit: endingDebit,
        ytdCredit: endingCredit,
        currency: 'IDR',
        calculatedAt: new Date()
      }
    });
    accountsUpdated++;
  }

  return {
    periodId,
    accountsUpdated,
    totalDebit: periodLines.reduce((s, l) => s + Number(l.debitAmount), 0),
    totalCredit: periodLines.reduce((s, l) => s + Number(l.creditAmount), 0)
  };
}


/**
 * Batch update GL Summary for a specific date range
 * 
 * @param {Object} params
 * @param {string} params.periodId - Accounting period ID
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 */
export async function recalculateGLSummary({ periodId, startDate, endDate }) {
  const period = await prisma.accountingPeriod.findUnique({
    where: { id: periodId }
  });

  if (!period) {
    throw new Error('Accounting period not found');
  }

  // Get all ledgers in date range
  const ledgers = await prisma.ledger.findMany({
    where: {
      periodId,
      transactionDate: {
        gte: startDate,
        lte: endDate
      },
      status: 'POSTED'
    },
    include: {
      ledgerLines: true
    }
  });

  // Group by date and COA
  const summaryMap = new Map();

  ledgers.forEach(ledger => {
    const dateKey = ledger.transactionDate.toISOString().split('T')[0];

    ledger.ledgerLines.forEach(line => {
      const key = `${dateKey}-${line.coaId}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          coaId: line.coaId,
          date: new Date(dateKey),
          debit: 0,
          credit: 0,
          count: 0
        });
      }

      const summary = summaryMap.get(key);
      summary.debit += line.debitAmount;
      summary.credit += line.creditAmount;
      summary.count += 1;
    });
  });

  // Update or create GL summary records
  for (const [key, summary] of summaryMap.entries()) {
    const summaryDate = new Date(summary.date);
    summaryDate.setHours(0, 0, 0, 0);

    const openingBalance = await calculateOpeningBalance(summary.coaId, periodId, summaryDate, prisma);
    const netChange = summary.debit - summary.credit;

    await prisma.generalLedgerSummary.upsert({
      where: {
        coaId_periodId_date: {
          coaId: summary.coaId,
          periodId,
          date: summaryDate
        }
      },
      update: {
        debitTotal: summary.debit,
        creditTotal: summary.credit,
        closingBalance: openingBalance + netChange,
        transactionCount: summary.count
      },
      create: {
        coaId: summary.coaId,
        periodId,
        date: summaryDate,
        openingBalance,
        debitTotal: summary.debit,
        creditTotal: summary.credit,
        closingBalance: openingBalance + netChange,
        transactionCount: summary.count,
        currency: 'IDR'
      }
    });
  }

  return {
    periodId,
    startDate,
    endDate,
    summariesUpdated: summaryMap.size
  };
}

export default {
  updateTrialBalance,
  updateGeneralLedgerSummary,
  recalculateTrialBalance,
  recalculateGLSummary
};
