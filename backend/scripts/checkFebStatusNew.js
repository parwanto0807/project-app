import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkFebStatus() {
  const febPeriodId = "5e7ff134-973e-4b50-b91a-6a473613fe17"; // The NEW Valid ID

  const coa = await prisma.chartOfAccounts.findFirst({ where: { code: '1-10205' } });
  
  if (!coa) {
    console.log('COA 1-10205 Not Found');
    return;
  }

  const tb = await prisma.trialBalance.findUnique({
    where: { periodId_coaId: { periodId: febPeriodId, coaId: coa.id } },
    include: { period: true }
  });

  if (tb) {
      console.log('--- FEB TB Record ---');
      console.log('ID:', tb.id);
      console.log('Opening:', tb.openingDebit);
      console.log('Period:', tb.periodDebit);
      console.log('Ending:', tb.endingDebit);
  } else {
      console.log('TB Record Not Found for this Period.');
  }

  // Also check if any Journal Entries exist for this period
  const ledger = await prisma.ledger.findFirst({
      where: { 
          periodId: febPeriodId, 
          ledgerNumber: { contains: '1-10205' } // unlikely
      }
      // Actually check lines
  });
  
  const adjustment = await prisma.ledgerLine.aggregate({
      where: {
          ledger: { periodId: febPeriodId, status: 'POSTED' },
          coaId: coa.id
      },
      _sum: { debitAmount: true }
  });
  console.log('Total Ledger Debit for Feb:', adjustment._sum.debitAmount);
}

checkFebStatus()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
