import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function check() {
  const periods = await prisma.accountingPeriod.findMany({
    orderBy: { startDate: 'asc' }
  });

  fs.writeFileSync('periods.json', JSON.stringify(periods, null, 2));
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
