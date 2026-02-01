import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function forceReconcile() {
  const userId = 'System-Force-Recon';
  const adjAccount = await prisma.chartOfAccounts.findFirst({ where: { code: '5-30001' } });
  
  // Feb period anchor
  const febPeriod = await prisma.accountingPeriod.findFirst({ where: { periodCode: '022026' } });
  const febDate = new Date("2026-02-01T00:00:00.000Z");

  const warehouses = await prisma.warehouse.findMany({
    where: { inventoryAccountId: { not: null } },
    include: { inventoryAccount: true }
  });

  const logs = [];

  for (const wh of warehouses) {
    const subLedgerValue = await prisma.stockBalance.aggregate({
      where: { warehouseId: wh.id, period: febDate },
      _sum: { inventoryValue: true }
    });
    const totalSubLedger = Number(subLedgerValue._sum.inventoryValue || 0);

    const currentTB = await prisma.trialBalance.findUnique({
      where: { periodId_coaId: { periodId: febPeriod.id, coaId: wh.inventoryAccountId } }
    });
    
    // Ending balance = Opening + Period
    const currentGLValue = currentTB ? (Number(currentTB.openingDebit) - Number(currentTB.openingCredit) + Number(currentTB.periodDebit) - Number(currentTB.periodCredit)) : 0;
    
    const diff = totalSubLedger - currentGLValue;

    if (Math.abs(diff) > 0.01) {
      logs.push(`Reconciling Feb ${wh.name}: Sub=${totalSubLedger}, GL=${currentGLValue}, Diff=${diff}`);
      
      const ledgerNumber = `JV-RECON-FEB-${wh.code}-${Date.now()}`;
      const ledger = await prisma.ledger.create({
        data: {
          ledgerNumber,
          referenceNumber: `RECON-FEB-${wh.code}`,
          referenceType: 'ADJUSTMENT',
          transactionDate: new Date("2026-02-01T10:00:00.000Z"),
          postingDate: new Date("2026-02-01T10:00:00.000Z"),
          description: `Force Reconciliation Feb - ${wh.name}`,
          periodId: febPeriod.id,
          status: 'POSTED',
          createdBy: userId,
          postedBy: userId,
          postedAt: new Date()
        }
      });

      const lines = [
        {
          ledgerId: ledger.id,
          coaId: wh.inventoryAccountId,
          debitAmount: diff > 0 ? diff : 0,
          creditAmount: diff < 0 ? Math.abs(diff) : 0,
          localAmount: diff,
          lineNumber: 1,
          description: `Adjustment to match actual inventory value`
        },
        {
          ledgerId: ledger.id,
          coaId: adjAccount.id,
          debitAmount: diff < 0 ? Math.abs(diff) : 0,
          creditAmount: diff > 0 ? diff : 0,
          localAmount: -diff,
          lineNumber: 2,
          description: `Inventory discrepancy offsets`
        }
      ];

      await prisma.ledgerLine.createMany({ data: lines });

      for (const line of lines) {
         const existingTB = await prisma.trialBalance.findUnique({
           where: { periodId_coaId: { periodId: febPeriod.id, coaId: line.coaId } }
         });
         
         if (existingTB) {
           await prisma.trialBalance.update({
             where: { id: existingTB.id },
             data: {
               periodDebit: { increment: line.debitAmount },
               periodCredit: { increment: line.creditAmount },
               endingDebit: { increment: line.debitAmount },
               endingCredit: { increment: line.creditAmount },
               ytdDebit: { increment: line.debitAmount },
               ytdCredit: { increment: line.creditAmount }
             }
           });
         } else {
           await prisma.trialBalance.create({
             data: {
               periodId: febPeriod.id,
               coaId: line.coaId,
               openingDebit: 0,
               openingCredit: 0,
               periodDebit: line.debitAmount,
               periodCredit: line.creditAmount,
               endingDebit: line.debitAmount,
               endingCredit: line.creditAmount,
               ytdDebit: line.debitAmount,
               ytdCredit: line.creditAmount,
               currency: 'IDR'
             }
           });
         }
      }
    } else {
      logs.push(`Skipping ${wh.name}: Already balanced (Value: ${totalSubLedger})`);
    }
  }

  fs.writeFileSync('force_recon_feb_log.json', JSON.stringify(logs, null, 2));
}

forceReconcile()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
