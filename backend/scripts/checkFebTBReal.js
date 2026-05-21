import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkFebRecord() {
  const febPeriodId = "bf1ce8ec-4d6b-41e8-9600-f41772022217"; // The one I used in rollover

  (() => {})('--- Checking COA 1-10205 ---');
  const coa = await prisma.chartOfAccounts.findFirst({
    where: { code: '1-10205' }
  });
  (() => {})('COA:', JSON.stringify(coa, null, 2));

  if (!coa) {
      (() => {})('COA NOT FOUND!');
      return;
  }

  (() => {})('--- Checking TB for Feb ---');
  const tb = await prisma.trialBalance.findUnique({
    where: { periodId_coaId: { periodId: febPeriodId, coaId: coa.id } },
    include: { period: true }
  });
  
  if (tb) {
      (() => {})('FOUND TB:', JSON.stringify(tb, null, 2));
  } else {
      (() => {})('TB NOT FOUND for Feb Period ID:', febPeriodId);
      // Let's search ALL Feb periods just in case
      const allTbs = await prisma.trialBalance.findMany({
          where: { coaId: coa.id },
          include: { period: true }
      });
      (() => {})('ALL TBs for this COA:', JSON.stringify(allTbs, null, 2));
  }
}

checkFebRecord()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
