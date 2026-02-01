import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function fixEndingBalances() {
  const febPeriodId = "fb69998f-7af7-43ab-abfc-468dbd83f7ea";
  
  const tbRecords = await prisma.trialBalance.findMany({
    where: { periodId: febPeriodId },
    include: { coa: true }
  });

  const updates = [];

  for (const record of tbRecords) {
    const openingD = Number(record.openingDebit || 0);
    const openingC = Number(record.openingCredit || 0);
    const periodD = Number(record.periodDebit || 0);
    const periodC = Number(record.periodCredit || 0);

    const netDebit = openingD + periodD;
    const netCredit = openingC + periodC;

    let endingDebit = 0;
    let endingCredit = 0;

    if (record.coa.normalBalance === 'DEBIT') {
      endingDebit = netDebit - netCredit;
      if (endingDebit < 0) {
        endingCredit = Math.abs(endingDebit);
        endingDebit = 0;
      }
    } else {
      endingCredit = netCredit - netDebit;
      if (endingCredit < 0) {
        endingDebit = Math.abs(endingCredit);
        endingCredit = 0;
      }
    }

    // Only update if there's a difference
    if (Math.abs(Number(record.endingDebit) - endingDebit) > 0.01 || Math.abs(Number(record.endingCredit) - endingCredit) > 0.01) {
      await prisma.trialBalance.update({
        where: { id: record.id },
        data: {
          endingDebit,
          endingCredit,
          calculatedAt: new Date()
        }
      });
      updates.push({ 
        account: record.coa.code, 
        oldEnding: `${record.endingDebit}/${record.endingCredit}`, 
        newEnding: `${endingDebit}/${endingCredit}` 
      });
    }
  }

  fs.writeFileSync('ending_balance_fix_log.json', JSON.stringify(updates, null, 2));
}

fixEndingBalances()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
