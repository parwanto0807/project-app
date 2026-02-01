import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function huntForId() {
  const lookFor = 'c115cabf'; 
  console.log(`Hunting for ${lookFor}...`);

  const tables = ['stockBalance', 'trialBalance', 'ledger', 'chartOfAccounts', 'warehouse'];
  
  for (const table of tables) {
      try {
          const res = await prisma[table].findFirst({
              where: { id: { startsWith: lookFor } }
          });
          if (res) {
              console.log(`FOUND in ${table}:`);
              console.log(JSON.stringify(res, null, 2));
          }
      } catch (e) {
          console.log(`Error checking ${table}: ${e.message}`);
      }
  }

  console.log('--- Checking Feb StockBalance ---');
  // Check StockBalance for WIP in Feb using period date
  const febDate = new Date("2026-02-01T00:00:00.000Z");
  const wh = await prisma.warehouse.findFirst({ where: { name: 'GUDANG WIP PROJECT ' } });
  
  if (wh) {
      const sb = await prisma.stockBalance.findFirst({
          where: { warehouseId: wh.id, period: febDate }
      });
      console.log('Feb StockBalance for WIP:', JSON.stringify(sb, null, 2));
      
      const agg = await prisma.stockBalance.aggregate({
          where: { warehouseId: wh.id, period: febDate },
          _sum: { inventoryValue: true }
      });
      console.log('Total Feb Inventory Value:', agg._sum.inventoryValue);
  }
}

huntForId()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
