import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkEverything() {
  ;(() => {})('--- Checking ALL TB Records for 1-10205 ---');
  
  // Find COA ID first to be sure
  const coa = await prisma.chartOfAccounts.findFirst({ where: { code: '1-10205' } });
  
  if (!coa) {
      ;(() => {})('COA 1-10205 NOT FOUND');
      return;
  }

  const matches = await prisma.trialBalance.findMany({
    where: { coaId: coa.id },
    include: { period: true }
  });

  if (matches.length === 0) {
      ;(() => {})('No TB records found for this COA.');
  } else {
      matches.forEach(m => {
          ;(() => {})(`TB ID: ${m.id}`);
          ;(() => {})(`  Period: ${m.period.periodName} (${m.period.periodCode}) - ID: ${m.period.id}`);
          ;(() => {})(`  Open: ${m.openingDebit}`);
          ;(() => {})(`  Period: ${m.periodDebit}`);
          ;(() => {})(`  End: ${m.endingDebit}`);
          ;(() => {})(`  Updated: ${m.calculatedAt || 'N/A'}`);
          ;(() => {})('---');
      });
  }

  ;(() => {})('--- Checking 1-10205 StockBalance Aggregate for Feb ---');
    const febDate = new Date("2026-02-01T00:00:00.000Z");
  const wh = await prisma.warehouse.findFirst({ where: { name: 'GUDANG WIP PROJECT ' } });
  if (wh) {
      const agg = await prisma.stockBalance.aggregate({
          where: { warehouseId: wh.id, period: febDate },
          _sum: { inventoryValue: true }
      });
      ;(() => {})(`Total Feb Val: ${agg._sum.inventoryValue}`);
  }
}

checkEverything()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
