import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function cleanupFebFinal() {
  const febPeriodId = "c8002762-0487-4989-a2cd-a86a434b01d2";
  const userId = 'System-Final-Cleanup';

  console.log('--- Cleaning Up February Reconciliation Journals ---');
  
  const ledgers = await prisma.ledger.findMany({
    where: { 
      ledgerNumber: { contains: 'RECON' },
      periodId: febPeriodId
    }
  });

  for (const ledger of ledgers) {
      console.log(`Deleting ${ledger.ledgerNumber}...`);
      await prisma.ledgerLine.deleteMany({ where: { ledgerId: ledger.id } });
      await prisma.ledger.delete({ where: { id: ledger.id } });
  }

  const wipCoa = await prisma.chartOfAccounts.findFirst({ where: { code: '1-10205' } });
  const bengkelCoa = await prisma.chartOfAccounts.findFirst({ where: { code: '1-10202' } });
  const adjAccount = await prisma.systemAccount.findUnique({ where: { key: 'INVENTORY_ADJUSTMENT_ACCOUNT' } });

  // RESET TB to Opening state
  console.log('--- Resetting TB to Clean Opening ---');
  const inventoryCoas = [wipCoa.id, bengkelCoa.id, adjAccount.coaId];
  for (const cid of inventoryCoas) {
      const tb = await prisma.trialBalance.findUnique({ where: { periodId_coaId: { periodId: febPeriodId, coaId: cid } } });
      if (tb) {
          await prisma.trialBalance.update({
              where: { id: tb.id },
              data: {
                  periodDebit: 0,
                  periodCredit: 0,
                  endingDebit: tb.openingDebit,
                  endingCredit: tb.openingCredit,
                  calculatedAt: new Date()
              }
          });
      }
  }

  // APPLY CORRECT ADJUSTMENTS
  // ACTUAL VALUES: WIP=52218200, BENGKEL=24010600
  // OPENING VALUES: WIP=33291200, BENGKEL=0
  
  const tasks = [
      { coaId: wipCoa.id, actual: 52218200, opening: 33291200, name: 'WIP' },
      { coaId: bengkelCoa.id, actual: 24010600, opening: 0, name: 'BENGKEL' }
  ];

  for (const task of tasks) {
      const diff = task.actual - task.opening;
      if (diff === 0) continue;

      const ledgerNumber = `JV-ADJ-STK-FINAL-${task.name}-${Date.now().toString().slice(-4)}`;
      const ledger = await prisma.ledger.create({
          data: {
              ledgerNumber,
              referenceNumber: `RECON-FINAL-${task.name}`,
              referenceType: 'ADJUSTMENT',
              transactionDate: new Date("2026-02-01T00:00:00.000Z"),
              postingDate: new Date("2026-02-01T00:00:00.000Z"),
              description: `Stock Reconciliation (Final) - ${task.name}`,
              periodId: febPeriodId,
              status: 'POSTED',
              createdBy: userId,
              postedBy: userId,
              postedAt: new Date()
          }
      });

      await prisma.ledgerLine.createMany({
          data: [
              { ledgerId: ledger.id, coaId: task.coaId, debitAmount: diff, creditAmount: 0, localAmount: diff, lineNumber: 1, description: 'Adj' },
              { ledgerId: ledger.id, coaId: adjAccount.coaId, debitAmount: 0, creditAmount: diff, localAmount: -diff, lineNumber: 2, description: 'Offset' }
          ]
      });

      // Update TB correctly
      await prisma.trialBalance.update({
          where: { periodId_coaId: { periodId: febPeriodId, coaId: task.coaId } },
          data: {
              periodDebit: { increment: diff },
              endingDebit: { increment: diff }
          }
      });
      await prisma.trialBalance.update({
          where: { periodId_coaId: { periodId: febPeriodId, coaId: adjAccount.coaId } },
          data: {
              periodCredit: { increment: diff },
              endingCredit: { increment: diff }
          }
      });
  }

  console.log('--- REPAIR COMPLETE ---');
}

cleanupFebFinal()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
