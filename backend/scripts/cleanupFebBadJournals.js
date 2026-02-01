import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function cleanupFebForReal() {
  const febPeriodId = "20cbd16c-bee0-4150-9cc6-dceb275a1890";
  const userId = 'System-Cleanup';

  console.log('--- Cleaning Up February Reconciliation Journals (Safe Mode) ---');
  
  const ledgers = await prisma.ledger.findMany({
    where: { 
      ledgerNumber: { startsWith: 'JV-ADJ-STK' },
      periodId: febPeriodId
    }
  });

  for (const ledger of ledgers) {
    console.log(`Processing ${ledger.ledgerNumber}...`);

    // 1. Unlink from possible parents
    await prisma.fundTransfer.updateMany({ where: { ledgerId: ledger.id }, data: { ledgerId: null } });
    
    // JournalEntry and PaymentVoucher are usually parents (Ledger points to them)
    // But let's check if they have back-references (one-to-one)
    
    // 2. Delete lines
    await prisma.ledgerLine.deleteMany({ where: { ledgerId: ledger.id } });

    // 3. Delete ledger
    await prisma.ledger.delete({ where: { id: ledger.id } });
  }

  // 4. Force Reset TB buckets for the WIP account specifically if it's stuck
  console.log('--- Resetting WIP TB buckets ---');
  const wipCoa = await prisma.chartOfAccounts.findFirst({ where: { code: '1-10205' } });
  
  // Directly set the buckets to a clean state: Opening 33.2M, Period 0, Ending 33.2M
  await prisma.trialBalance.update({
      where: { periodId_coaId: { periodId: febPeriodId, coaId: wipCoa.id } },
      data: {
          periodDebit: 0,
          periodCredit: 0,
          endingDebit: 33291200,
          endingCredit: 0,
          calculatedAt: new Date()
      }
  });

  // Also reset GUDANG BENGKEL (1-10202)
  const bengkelCoa = await prisma.chartOfAccounts.findFirst({ where: { code: '1-10202' } });
  await prisma.trialBalance.update({
      where: { periodId_coaId: { periodId: febPeriodId, coaId: bengkelCoa.id } },
      data: {
          periodDebit: 0,
          periodCredit: 0,
          endingDebit: 0,
          endingCredit: 0,
          calculatedAt: new Date()
      }
  });

  console.log('--- Creating CORRECT Reconciliation Journals ---');
  // actual stock for WIP is 52,218,200
  // actual stock for BENGKEL is 24,010,600
  
  const adjAccount = await prisma.systemAccount.findUnique({ where: { key: 'INVENTORY_ADJUSTMENT_ACCOUNT' } });

  const corrections = [
      { coa: wipCoa, total: 52218200, opening: 33291200, wh: 'WIP' },
      { coa: bengkelCoa, total: 24010600, opening: 0, wh: 'BENGKEL' }
  ];

  for (const c of corrections) {
      const diff = c.total - c.opening;
      const ledgerNumber = `JV-ADJ-STK-OK-${c.wh}-${Date.now().toString().slice(-4)}`;
      
      const l = await prisma.ledger.create({
          data: {
              ledgerNumber,
              referenceNumber: `RECON-OK-${c.wh}`,
              referenceType: 'ADJUSTMENT',
              transactionDate: new Date("2026-02-01T00:00:00.000Z"),
              postingDate: new Date("2026-02-01T00:00:00.000Z"),
              description: `Stock Recon (Ok) - ${c.wh}`,
              periodId: febPeriodId,
              status: 'POSTED',
              createdBy: userId,
              postedBy: userId,
              postedAt: new Date()
          }
      });

      await prisma.ledgerLine.createMany({
          data: [
              { ledgerId: l.id, coaId: c.coa.id, debitAmount: diff, creditAmount: 0, localAmount: diff, lineNumber: 1, description: 'Adj' },
              { ledgerId: l.id, coaId: adjAccount.coaId, debitAmount: 0, creditAmount: diff, localAmount: -diff, lineNumber: 2, description: 'Offset' }
          ]
      });

      // Update TB correctly: Add the DIFF to the buckets
      await prisma.trialBalance.update({
          where: { periodId_coaId: { periodId: febPeriodId, coaId: c.coa.id } },
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

  console.log('--- DONE ---');
}

cleanupFebForReal()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
