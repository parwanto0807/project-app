import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkFebLedgers() {
  const feb = await prisma.accountingPeriod.findFirst({ where: { periodCode: '022026' } });
  
  const ledgers = await prisma.ledger.findMany({
    where: { periodId: feb.id },
    include: { ledgerLines: { include: { coa: true } } }
  });

  const summary = ledgers.map(l => ({
    number: l.ledgerNumber,
    description: l.description,
    lines: l.ledgerLines.map(line => ({
      account: line.coa.code,
      debit: line.debitAmount,
      credit: line.creditAmount
    }))
  }));

  fs.writeFileSync('feb_ledgers_check.json', JSON.stringify(summary, null, 2));
}

checkFebLedgers()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
