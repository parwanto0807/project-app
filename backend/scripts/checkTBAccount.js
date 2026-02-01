import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function check() {
  const coa = await prisma.chartOfAccounts.findFirst({
    where: { code: '6-10102' }
  });

  if (!coa) {
    fs.writeFileSync('output.json', JSON.stringify({ error: 'COA not found' }));
    return;
  }

  const tb = await prisma.trialBalance.findMany({
    where: { coaId: coa.id },
    include: {
      period: true
    },
    orderBy: {
      period: {
        startDate: 'asc'
      }
    }
  });

  fs.writeFileSync('output.json', JSON.stringify({ coa, tb }, null, 2));
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
