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
    // Get opening balance from previous period or set to 0
    const period = await prismaClient.accountingPeriod.findUnique({
      where: { id: periodId }
    });

    const coa = await prismaClient.chartOfAccounts.findUnique({
      where: { id: coaId }
    });

    // For simplicity, opening balance = 0 for new records
    // In production, you should calculate from previous period
    const openingDebit = 0;
    const openingCredit = 0;

    await prismaClient.trialBalance.create({
      data: {
        periodId,
        coaId,
        openingDebit,
        openingCredit,
        periodDebit: debitAmount,
        periodCredit: creditAmount,
        endingDebit: openingDebit + debitAmount,
        endingCredit: openingCredit + creditAmount,
        ytdDebit: debitAmount,
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
    
    await prismaClient.generalLedgerSummary.update({
      where: {
        coaId_periodId_date: {
          coaId,
          periodId,
          date: summaryDate
        }
      },
      data: {
        debitTotal: { increment: debitAmount },
        creditTotal: { increment: creditAmount },
        closingBalance: { increment: netChange },
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
 * Gets closing balance from previous day
 */
async function calculateOpeningBalance(coaId, periodId, date, prismaClient) {
  // Get previous day
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);

  // Find summary for previous day
  const previousSummary = await prismaClient.generalLedgerSummary.findFirst({
    where: {
      coaId,
      periodId,
      date: { lte: previousDay }
    },
    orderBy: {
      date: 'desc'
    }
  });

  return previousSummary?.closingBalance || 0;
}

/**
 * Batch update Trial Balance for all accounts in a period
 * Useful for recalculation or period closing
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

  // Get all ledger lines in this period
  const ledgerLines = await prisma.ledgerLine.findMany({
    where: {
      ledger: {
        periodId,
        status: 'POSTED'
      }
    },
    include: {
      ledger: true
    }
  });

  // Group by COA
  const coaMap = new Map();

  ledgerLines.forEach(line => {
    if (!coaMap.has(line.coaId)) {
      coaMap.set(line.coaId, {
        debit: 0,
        credit: 0
      });
    }

    const coa = coaMap.get(line.coaId);
    coa.debit += line.debitAmount;
    coa.credit += line.creditAmount;
  });

  // Update or create trial balance records
  for (const [coaId, amounts] of coaMap.entries()) {
    await prisma.trialBalance.upsert({
      where: {
        periodId_coaId: {
          periodId,
          coaId
        }
      },
      update: {
        periodDebit: amounts.debit,
        periodCredit: amounts.credit,
        endingDebit: amounts.debit, // Simplified, should include opening
        endingCredit: amounts.credit,
        ytdDebit: amounts.debit,
        ytdCredit: amounts.credit,
        calculatedAt: new Date()
      },
      create: {
        periodId,
        coaId,
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: amounts.debit,
        periodCredit: amounts.credit,
        endingDebit: amounts.debit,
        endingCredit: amounts.credit,
        ytdDebit: amounts.debit,
        ytdCredit: amounts.credit,
        currency: 'IDR',
        calculatedAt: new Date()
      }
    });
  }

  return {
    periodId,
    accountsUpdated: coaMap.size,
    totalDebit: Array.from(coaMap.values()).reduce((sum, a) => sum + a.debit, 0),
    totalCredit: Array.from(coaMap.values()).reduce((sum, a) => sum + a.credit, 0)
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
