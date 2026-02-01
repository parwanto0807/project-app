import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkStock() {
  const balances = await prisma.stockBalance.findMany({
    where: { inventoryValue: { gt: 0 } },
    include: { warehouse: true, product: true }
  });

  const periodGroups = balances.reduce((acc, b) => {
    const periodStr = b.period.toISOString();
    if (!acc[periodStr]) acc[periodStr] = [];
    acc[periodStr].push({
      warehouse: b.warehouse.name,
      product: b.product.name,
      value: b.inventoryValue
    });
    return acc;
  }, {});

  fs.writeFileSync('all_stock_values.json', JSON.stringify(periodGroups, null, 2));
}

checkStock()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
