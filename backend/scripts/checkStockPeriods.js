import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkPeriods() {
  const periods = await prisma.stockBalance.groupBy({
    by: ['period']
  });
  fs.writeFileSync('stock_periods.json', JSON.stringify(periods, null, 2));
}

checkPeriods()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
