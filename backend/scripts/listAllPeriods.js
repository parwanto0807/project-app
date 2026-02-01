import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function listPeriods() {
  const periods = await prisma.accountingPeriod.findMany({
    orderBy: { startDate: 'asc' }
  });
  console.log(JSON.stringify(periods, null, 2));
}

listPeriods()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
