import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function forceReconcile() {
  const userId = 'System-Force-Recon';
  
  // 1. Get COA 5-30001
  const adjAccount = await prisma.chartOfAccounts.findFirst({ where: { code: '5-30001' } });
  if (!adjAccount) throw new Error('COA 5-30001 not found');
  
  // 2. Mapping Warehouses (Standard names)
  const coaMap = {
    'GUDANG BENGKEL': '1-10202',
    'GUDANG KEBON': '1-10203',
    'GUDANG B ZHAENAL': '1-10204',
    'GUDANG WIP PROJECT ': '1-10205'
  };

  for (const [whName, coaCode] of Object.entries(coaMap)) {
    const coa = await prisma.chartOfAccounts.findFirst({ where: { code: coaCode } });
    if (coa) {
      await prisma.warehouse.updateMany({
        where: { name: whName },
        data: { inventoryAccountId: coa.id }
      });
    }
  }

  // 3. Reconcile for Jan (2026-01-31T17:00:00.000Z)
  const janPeriod = await prisma.accountingPeriod.findFirst({ where: { periodCode: '012026' } });
  const janPeriodStart = new Date("2026-01-31T17:00:00.000Z"); 

  const warehouses = await prisma.warehouse.findMany({
    where: { inventoryAccountId: { not: null } },
    include: { inventoryAccount: true }
  });

  const logs = [];

  for (const wh of warehouses) {
    // Sub-ledger Value
    const subLedgerValue = await prisma.stockBalance.aggregate({
      where: { warehouseId: wh.id, period: janPeriodStart },
      _sum: { inventoryValue: true }
    });
    const totalSubLedger = Number(subLedgerValue._sum.inventoryValue || 0);

    // GL Value
    const currentTB = await prisma.trialBalance.findUnique({
      where: { periodId_coaId: { periodId: janPeriod.id, coaId: wh.inventoryAccountId } }
    });
    
    let currentGLValue = 0;
    if (currentTB) {
      currentGLValue = Number(currentTB.endingDebit) - Number(currentTB.endingCredit);
    }
    
    const diff = totalSubLedger - currentGLValue;

    if (Math.abs(diff) > 0.01) {
      logs.push(`Reconciling ${wh.name}: Sub=${totalSubLedger}, GL=${currentGLValue}, Diff=${diff}`);
      
      const ledgerNumber = `JV-RECON-JAN-${wh.code}-${Date.now()}`;
      const ledger = await prisma.ledger.create({
        data: {
          ledgerNumber,
          referenceNumber: `RECON-JAN-${wh.code}`,
          referenceType: 'ADJUSTMENT',
          transactionDate: new Date("2026-01-31T15:00:00.000Z"),
          postingDate: new Date("2026-01-31T15:00:00.000Z"),
          description: `Force Reconciliation Jan - ${wh.name}`,
          periodId: janPeriod.id,
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

      // Update Trial Balance manually since we're outside service call context
      for (const line of lines) {
         const existingTB = await prisma.trialBalance.findUnique({
           where: { periodId_coaId: { periodId: janPeriod.id, coaId: line.coaId } }
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
               periodId: janPeriod.id,
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

  // 4. Roll-over to February
  const febPeriod = await prisma.accountingPeriod.findFirst({ where: { periodCode: '022026' } });
  
  for (const wh of warehouses) {
    const finalJanTB = await prisma.trialBalance.findUnique({
      where: { periodId_coaId: { periodId: janPeriod.id, coaId: wh.inventoryAccountId } }
    });
    
    if (finalJanTB) {
      await prisma.trialBalance.upsert({
        where: { periodId_coaId: { periodId: febPeriod.id, coaId: wh.inventoryAccountId } },
        update: {
          openingDebit: finalJanTB.endingDebit,
          openingCredit: finalJanTB.endingCredit
        },
        create: {
          periodId: febPeriod.id,
          coaId: wh.inventoryAccountId,
          openingDebit: finalJanTB.endingDebit,
          openingCredit: finalJanTB.endingCredit,
          periodDebit: 0,
          periodCredit: 0,
          endingDebit: 0,
          endingCredit: 0,
          currency: 'IDR'
        }
      });
    }
  }

  fs.writeFileSync('force_recon_log.json', JSON.stringify(logs, null, 2));
}

forceReconcile()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
