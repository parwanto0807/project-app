import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkInventory() {
  // 1. Get all warehouses and their linked accounts
  const warehouses = await prisma.warehouse.findMany({
    include: { inventoryAccount: true }
  });

  // 2. Get the current period (Jan 2026)
  const janPeriod = await prisma.accountingPeriod.findFirst({
    where: { periodCode: '012026' }
  });

  const results = [];

  for (const wh of warehouses) {
    if (!wh.inventoryAccountId) {
      results.push({ warehouse: wh.name, status: 'No account linked' });
      continue;
    }

    // A. Sub-ledger Value (StockBalance)
    // We need to be careful with the date. Based on previous logs, Jan period start is 2025-12-31T17:00:00.000Z
    const subLedgerValue = await prisma.stockBalance.aggregate({
      where: {
        warehouseId: wh.id,
        period: janPeriod.startDate
      },
      _sum: { inventoryValue: true }
    });

    // B. GL Value (TrialBalance)
    const tb = await prisma.trialBalance.findUnique({
      where: {
        periodId_coaId: {
          periodId: janPeriod.id,
          coaId: wh.inventoryAccountId
        }
      }
    });

    results.push({
      warehouse: wh.name,
      account: wh.inventoryAccount.code,
      subLedger: Number(subLedgerValue._sum.inventoryValue || 0),
      glOpening: Number(tb?.openingDebit || 0) - Number(tb?.openingCredit || 0),
      glPeriod: Number(tb?.periodDebit || 0) - Number(tb?.periodCredit || 0),
      glEnding: Number(tb?.endingDebit || 0) - Number(tb?.endingCredit || 0),
      diff: Number(subLedgerValue._sum.inventoryValue || 0) - (Number(tb?.endingDebit || 0) - Number(tb?.endingCredit || 0))
    });
  }

  // 3. Check for Adjustment Account Mapping
  const adjMapping = await prisma.systemAccount.findUnique({
    where: { key: 'INVENTORY_ADJUSTMENT_ACCOUNT' },
    include: { coa: true }
  });

  fs.writeFileSync('inventory_recon_check.json', JSON.stringify({ janPeriod, adjMapping, results }, null, 2));
}

checkInventory()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
