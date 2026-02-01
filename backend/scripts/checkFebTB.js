import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkFebInventory() {
  const febPeriodId = "fb69998f-7af7-43ab-abfc-468dbd83f7ea";
  
  const warehouses = await prisma.warehouse.findMany({
    include: { inventoryAccount: true }
  });

  const results = [];

  for (const wh of warehouses) {
    if (!wh.inventoryAccountId) continue;

    const tb = await prisma.trialBalance.findUnique({
      where: {
        periodId_coaId: {
          periodId: febPeriodId,
          coaId: wh.inventoryAccountId
        }
      }
    });

    results.push({
      warehouse: wh.name,
      account: wh.inventoryAccount.code,
      opening: Number(tb?.openingDebit || 0) - Number(tb?.openingCredit || 0),
      period: Number(tb?.periodDebit || 0) - Number(tb?.periodCredit || 0),
      ending: Number(tb?.endingDebit || 0) - Number(tb?.endingCredit || 0)
    });
  }

  fs.writeFileSync('feb_tb_check.json', JSON.stringify(results, null, 2));
}

checkFebInventory()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
