import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkBadJournals() {
  const ledgers = await prisma.ledger.findMany({
    where: { ledgerNumber: { startsWith: 'JV-ADJ-STK' } },
    include: { period: true, ledgerLines: { include: { coa: true } } }
  });

  const tbJan = await prisma.trialBalance.findMany({
    where: { period: { periodCode: '012026' } },
    include: { coa: true }
  });

  const tbFeb = await prisma.trialBalance.findMany({
    where: { period: { periodCode: '022026' } },
    include: { coa: true }
  });

  fs.writeFileSync('bad_journals_check.json', JSON.stringify({ ledgers, tbJan, tbFeb }, null, 2));
}

checkBadJournals()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
