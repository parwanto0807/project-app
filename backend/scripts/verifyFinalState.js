import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function verifyState() {
  const jan = await prisma.accountingPeriod.findFirst({ where: { periodCode: '012026' } });
  const feb = await prisma.accountingPeriod.findFirst({ where: { periodCode: '022026' } });
  const coa = await prisma.chartOfAccounts.findFirst({ where: { code: '1-10205' } });

  const tbJan = await prisma.trialBalance.findUnique({ where: { periodId_coaId: { periodId: jan.id, coaId: coa.id } } });
  const tbFeb = await prisma.trialBalance.findUnique({ where: { periodId_coaId: { periodId: feb.id, coaId: coa.id } } });

  const results = {
    account: coa.code,
    january: {
      opening: tbJan.openingDebit,
      period: tbJan.periodDebit,
      ending: tbJan.endingDebit
    },
    february: {
      opening: tbFeb.openingDebit,
      period: tbFeb.periodDebit,
      ending: tbFeb.endingDebit
    }
  };

  fs.writeFileSync('final_state_verification.json', JSON.stringify(results, null, 2));
}

verifyState()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
