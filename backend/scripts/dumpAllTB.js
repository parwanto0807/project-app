import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkEverything() {
  console.log('--- Checking ALL TB Records for 1-10205 ---');
  
  // Find COA ID first to be sure
  const coa = await prisma.chartOfAccounts.findFirst({ where: { code: '1-10205' } });
  
  if (!coa) {
      console.log('COA 1-10205 NOT FOUND');
      return;
  }

  const matches = await prisma.trialBalance.findMany({
    where: { coaId: coa.id },
    include: { period: true }
  });

  if (matches.length === 0) {
      console.log('No TB records found for this COA.');
  } else {
      matches.forEach(m => {
          console.log(`TB ID: ${m.id}`);
          console.log(`  Period: ${m.period.periodName} (${m.period.periodCode}) - ID: ${m.period.id}`);
          console.log(`  Open: ${m.openingDebit}`);
          console.log(`  Period: ${m.periodDebit}`);
          console.log(`  End: ${m.endingDebit}`);
          console.log(`  Updated: ${m.calculatedAt || 'N/A'}`);
          console.log('---');
      });
  }

  console.log('--- Checking 1-10205 StockBalance Aggregate for Feb ---');
    const febDate = new Date("2026-02-01T00:00:00.000Z");
  const wh = await prisma.warehouse.findFirst({ where: { name: 'GUDANG WIP PROJECT ' } });
  if (wh) {
      const agg = await prisma.stockBalance.aggregate({
          where: { warehouseId: wh.id, period: febDate },
          _sum: { inventoryValue: true }
      });
      console.log(`Total Feb Val: ${agg._sum.inventoryValue}`);
  }
}

checkEverything()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
