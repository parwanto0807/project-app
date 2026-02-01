import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkFebInventory() {
  const febDate = new Date("2026-02-01T00:00:00.000Z");
  
  const balances = await prisma.stockBalance.findMany({
    where: { period: febDate },
    include: { warehouse: true }
  });

  const summary = balances.reduce((acc, b) => {
    const whName = b.warehouse.name;
    if (!acc[whName]) acc[whName] = 0;
    acc[whName] += Number(b.inventoryValue || 0);
    return acc;
  }, {});

  fs.writeFileSync('feb_inventory_values.json', JSON.stringify(summary, null, 2));
}

checkFebInventory()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
