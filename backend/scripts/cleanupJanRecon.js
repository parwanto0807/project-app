import { prisma } from "../src/config/db.js";
import financialSummaryService from '../src/services/accounting/financialSummaryService.js';
import fs from 'fs';

async function cleanupAndFix() {
  const janPeriodId = "e14167d7-6e0e-4d6b-9964-79b2128370dc";
  const febPeriodId = "20cbd16c-bee0-4150-9cc6-dceb275a1890";

  console.log('--- Cleaning Up January Reconciliation Journals ---');
  
  const ledgers = await prisma.ledger.findMany({
    where: { 
      ledgerNumber: { startsWith: 'JV-ADJ-STK' },
      periodId: janPeriodId
    },
    include: { ledgerLines: true }
  });

  console.log(`Found ${ledgers.length} journals in January to remove.`);

  for (const ledger of ledgers) {
    console.log(`Removing Ledger: ${ledger.ledgerNumber}`);
    await prisma.ledgerLine.deleteMany({ where: { ledgerId: ledger.id } });
    await prisma.ledger.delete({ where: { id: ledger.id } });
  }

  console.log('--- Recalculating January Trial Balance ---');
  await financialSummaryService.recalculateTrialBalance(janPeriodId);

  console.log('--- Updating February Opening Balances from January Ending ---');
  const janTB = await prisma.trialBalance.findMany({
    where: { periodId: janPeriodId }
  });

  for (const item of janTB) {
    const openD = Number(item.endingDebit);
    const openC = Number(item.endingCredit);

    await prisma.trialBalance.upsert({
      where: { periodId_coaId: { periodId: febPeriodId, coaId: item.coaId } },
      update: {
        openingDebit: openD,
        openingCredit: openC,
        endingDebit: openD,
        endingCredit: openC,
        calculatedAt: new Date()
      },
      create: {
        periodId: febPeriodId,
        coaId: item.coaId,
        openingDebit: openD,
        openingCredit: openC,
        periodDebit: 0,
        periodCredit: 0,
        endingDebit: openD,
        endingCredit: openC,
        currency: 'IDR',
        calculatedAt: new Date()
      }
    });
  }

  console.log('--- Recalculating February Trial Balance ---');
  await financialSummaryService.recalculateTrialBalance(febPeriodId);

  console.log('--- Cleanup Complete. ---');
}

cleanupAndFix()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
