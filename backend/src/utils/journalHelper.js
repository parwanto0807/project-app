import { prisma } from '../config/db.js';
import { normalizeToJakartaStartOfDay } from './dateUtils.js';

/**
 * Get System Account by key
 * @param {string} key - System account key (e.g., 'PURCHASE_EXPENSE', 'PROJECT_WIP')
 * @param {Object} tx - Prisma transaction object (optional)
 * @returns {Promise<Object>} System account with COA details
 */
export async function getSystemAccount(key, tx) {
  const prismaClient = tx || prisma;
  
  const systemAccount = await prismaClient.systemAccount.findUnique({
    where: { key },
    include: {
      coa: true
    }
  });

  if (!systemAccount) {
    throw new Error(`System account '${key}' not found. Please run seedSystemAccounts.js`);
  }

  if (!systemAccount.coa) {
    throw new Error(`COA not linked for system account '${key}'`);
  }

  if (systemAccount.coa.postingType !== 'POSTING') {
    throw new Error(`Account ${systemAccount.coa.code} (${systemAccount.coa.name}) is a HEADER account and cannot be used for posting`);
  }

  return systemAccount;
}

/**
 * Get or create accounting period for a given date
 * @param {Date} date - Transaction date
 * @param {Object} tx - Prisma transaction object (optional)
 * @returns {Promise<Object>} Accounting period
 */
async function getOrCreateAccountingPeriod(date, tx) {
  const prismaClient = tx || prisma;

  // Use Jakarta time (UTC+7) to determine the correct month,
  // consistent with how closingService anchors period dates.
  const jakartaDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  const year = jakartaDate.getUTCFullYear();
  const month = jakartaDate.getUTCMonth() + 1; // 1-12
  const periodCode = `${String(month).padStart(2, '0')}-${year}`; // MM-YYYY

  // Store start/end as UTC midnight (consistent with closingService)
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const periodName = `${monthNames[month - 1]} ${year}`;
  const quarter = Math.ceil(month / 3);

  // Try by periodCode first, then fallback to fiscalYear+periodMonth
  // (period may already exist with a different code format e.g. '012026' vs '03-2026')
  let period = await prismaClient.accountingPeriod.findUnique({
    where: { periodCode }
  });

  if (!period) {
    // Fallback: find by fiscalYear + periodMonth composite
    period = await prismaClient.accountingPeriod.findFirst({
      where: { fiscalYear: year, periodMonth: month }
    });
  }

  if (!period) {
    period = await prismaClient.accountingPeriod.create({
      data: {
        periodCode,
        periodName,
        startDate,
        endDate,
        fiscalYear: year,
        periodMonth: month,
        quarter,
        isClosed: false
      }
    });
    console.log(`✅ Created accounting period: ${periodCode} (${periodName})`);
  }

  return period;
}

/**
 * Update General Ledger Summary for a specific account and date
 * @param {string} coaId - Chart of Accounts ID
 * @param {string} periodId - Accounting Period ID
 * @param {Date} date - Transaction date
 * @param {number} debit - Debit amount
 * @param {number} credit - Credit amount
 * @param {Object} tx - Prisma transaction object
 */
async function updateGeneralLedgerSummary(coaId, periodId, date, debit, credit, tx) {
  const prismaClient = tx || prisma;
  
  // Normalize date to start of day in Jakarta
  const normalizedDate = normalizeToJakartaStartOfDay(date);

  // Get or create summary record
  let summary = await prismaClient.generalLedgerSummary.findUnique({
    where: {
      coaId_periodId_date: {
        coaId,
        periodId,
        date: normalizedDate
      }
    }
  });

  if (!summary) {
    // Create new summary
    summary = await prismaClient.generalLedgerSummary.create({
      data: {
        coaId,
        periodId,
        date: normalizedDate,
        openingBalance: 0,
        debitTotal: debit,
        creditTotal: credit,
        closingBalance: debit - credit,
        transactionCount: 1,
        currency: 'IDR'
      }
    });
  } else {
    // Update existing summary
    const newDebitTotal = Number(summary.debitTotal) + debit;
    const newCreditTotal = Number(summary.creditTotal) + credit;
    const newClosingBalance = Number(summary.openingBalance) + newDebitTotal - newCreditTotal;

    await prismaClient.generalLedgerSummary.update({
      where: {
        coaId_periodId_date: {
          coaId,
          periodId,
          date: normalizedDate
        }
      },
      data: {
        debitTotal: newDebitTotal,
        creditTotal: newCreditTotal,
        closingBalance: newClosingBalance,
        transactionCount: { increment: 1 }
      }
    });
  }
}

/**
 * Update Trial Balance for a specific account and period
 * @param {string} coaId - Chart of Accounts ID
 * @param {string} periodId - Accounting Period ID
 * @param {number} debit - Debit amount
 * @param {number} credit - Credit amount
 * @param {Object} tx - Prisma transaction object
 */
async function updateTrialBalance(coaId, periodId, debit, credit, tx) {
  const prismaClient = tx || prisma;

  // Get or create trial balance record
  let trialBalance = await prismaClient.trialBalance.findUnique({
    where: {
      periodId_coaId: {
        periodId,
        coaId
      }
    }
  });

  if (!trialBalance) {
    // Create new trial balance
    trialBalance = await prismaClient.trialBalance.create({
      data: {
        periodId,
        coaId,
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: debit,
        periodCredit: credit,
        endingDebit: debit,
        endingCredit: credit,
        ytdDebit: debit,
        ytdCredit: credit,
        currency: 'IDR',
        calculatedAt: new Date()
      }
    });
  } else {
    // Update existing trial balance
    const newPeriodDebit = Number(trialBalance.periodDebit) + debit;
    const newPeriodCredit = Number(trialBalance.periodCredit) + credit;
    const newEndingDebit = Number(trialBalance.openingDebit) + newPeriodDebit;
    const newEndingCredit = Number(trialBalance.openingCredit) + newPeriodCredit;

    await prismaClient.trialBalance.update({
      where: {
        periodId_coaId: {
          periodId,
          coaId
        }
      },
      data: {
        periodDebit: newPeriodDebit,
        periodCredit: newPeriodCredit,
        endingDebit: newEndingDebit,
        endingCredit: newEndingCredit,
        ytdDebit: newEndingDebit,
        ytdCredit: newEndingCredit,
        calculatedAt: new Date()
      }
    });
  }
}

/**
 * Create Ledger Entry with automatic numbering, validation, and summary updates
 * @param {Object} params - Ledger parameters
 * @param {string} params.referenceType - Ledger entry type (e.g., 'JOURNAL', 'GOODS_RECEIPT')
 * @param {string} params.referenceId - Reference document ID
 * @param {string} params.referenceNumber - Reference document number
 * @param {Date} params.tanggal - Transaction date
 * @param {string} params.keterangan - Ledger description
 * @param {Array} params.entries - Array of entries with systemAccountKey
 * @param {string} params.createdById - ID of the user creating the entry
 * @param {Object} params.tx - Prisma transaction object (REQUIRED for atomic operations)
 * @returns {Promise<Object>} Created ledger entry
 */
export async function createLedgerEntry({ 
  referenceType, 
  referenceId, 
  referenceNumber, 
  tanggal, 
  keterangan, 
  entries, 
  createdById,
  tx 
}) {
  if (!tx) {
    throw new Error('Transaction context (tx) is required for createLedgerEntry');
  }

  const prismaClient = tx;
  
  try {
    // Get or create accounting period
    const period = await getOrCreateAccountingPeriod(tanggal, prismaClient);

    // Generate ledger number
    const now = new Date(tanggal || Date.now());
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `JV-${yearMonth}`;
    
    const lastLedger = await prismaClient.ledger.findFirst({
      where: {
        ledgerNumber: {
          startsWith: prefix
        }
      },
      orderBy: { ledgerNumber: 'desc' }
    });

    let sequence = 1;
    if (lastLedger) {
      const parts = lastLedger.ledgerNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    const ledgerNumber = `${prefix}-${String(sequence).padStart(4, '0')}`;

    // Prepare lines using SystemAccounts OR direct COA
    const preparedLines = await Promise.all(entries.map(async (entry, index) => {
      let coa;
      
      // ✅ Support both systemAccountKey and direct coaId
      if (entry.systemAccountKey) {
        // Use SystemAccount lookup
        const systemAccount = await getSystemAccount(entry.systemAccountKey, prismaClient);
        coa = systemAccount.coa;
      } else if (entry.coaId) {
        // Use direct COA ID
        coa = await prismaClient.chartOfAccounts.findUnique({
          where: { id: entry.coaId }
        });
        
        if (!coa) {
          throw new Error(`COA with ID '${entry.coaId}' not found`);
        }
        
        if (coa.postingType !== 'POSTING') {
          throw new Error(`Account ${coa.code} (${coa.name}) is a HEADER account and cannot be used for posting`);
        }
      } else {
        throw new Error(`Entry ${index + 1} must have either systemAccountKey or coaId`);
      }

      return {
        lineNumber: index + 1,
        coaId: coa.id,
        accountCode: coa.code,
        accountName: coa.name,
        debitAmount: Number(entry.debit || 0),
        creditAmount: Number(entry.credit || 0),
        description: entry.keterangan || keterangan,
        projectId: entry.projectId || null,
        customerId: entry.customerId || null,
        supplierId: entry.supplierId || null,
        karyawanId: entry.karyawanId || null,
        salesOrderId: entry.salesOrderId || null
      };
    }));

    // Calculate totals for validation
    const totalDebit = preparedLines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = preparedLines.reduce((sum, line) => sum + line.creditAmount, 0);

    // Validate balance (allow 0.01 tolerance for rounding)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Ledger not balanced! Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}, ` +
        `Difference: ${(totalDebit - totalCredit).toFixed(2)}`
      );
    }

    // Create ledger entry
    const ledger = await prismaClient.ledger.create({
      data: {
        ledgerNumber,
        referenceNumber,
        referenceType: referenceType || 'JOURNAL',
        transactionDate: tanggal,
        postingDate: new Date(),
        description: keterangan,
        periodId: period.id,
        status: 'POSTED',
        createdBy: createdById || 'SYSTEM',
        postedBy: createdById || 'SYSTEM',
        postedAt: new Date(),
        ledgerLines: {
          create: preparedLines.map(line => ({
            lineNumber: line.lineNumber,
            coaId: line.coaId,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            localAmount: line.debitAmount > 0 ? line.debitAmount : line.creditAmount,
            description: line.description,
            currency: 'IDR',
            projectId: line.projectId,
            customerId: line.customerId,
            supplierId: line.supplierId,
            karyawanId: line.karyawanId,
            salesOrderId: line.salesOrderId
          }))
        }
      },
      include: {
        ledgerLines: {
          include: {
            coa: true
          },
          orderBy: {
            lineNumber: 'asc'
          }
        }
      }
    });

    // Update GeneralLedgerSummary and TrialBalance for each line
    for (const line of preparedLines) {
      await updateGeneralLedgerSummary(
        line.coaId,
        period.id,
        tanggal,
        line.debitAmount,
        line.creditAmount,
        prismaClient
      );

      await updateTrialBalance(
        line.coaId,
        period.id,
        line.debitAmount,
        line.creditAmount,
        prismaClient
      );
    }

    console.log(`✅ Ledger Entry Created: ${ledgerNumber} | Total Amount: ${totalDebit}`);
    console.log(`✅ Updated GeneralLedgerSummary and TrialBalance for ${preparedLines.length} accounts`);
    
    return ledger;
  } catch (error) {
    console.error(`❌ Error creating ledger entry:`, error);
    throw error;
  }
}


/**
 * Get warehouse inventory account code
 * @param {Object} warehouse - Warehouse object with inventoryAccount relation
 * @returns {string} System account key
 */
export function getWarehouseInventoryAccountKey(warehouse) {
  // Always use PROJECT_WIP for WIP warehouses
  if (warehouse.isWip) {
    return 'PROJECT_WIP';
  }

  // For other warehouses, you might need different logic
  // For now, return a default (this should be customized based on your needs)
  return 'PROJECT_WIP'; // TODO: Add more warehouse types if needed
}

