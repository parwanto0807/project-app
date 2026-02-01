import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkRecord() {
  const tb = await prisma.trialBalance.findMany({
    where: { coa: { code: '1-10205' } },
    include: { coa: true, period: true }
  });
  console.log(JSON.stringify(tb, null, 2));
}

checkRecord()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
