import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkSpecificId() {
  const idToCheck = '2242b43b'; 
  console.log(`Checking ID ${idToCheck}...`);

  const tb = await prisma.trialBalance.findFirst({
    where: { id: { startsWith: idToCheck } },
    include: { coa: true, period: true }
  });

  if (tb) {
      console.log('Record Found:');
      console.log('Period:', tb.period.periodName, tb.period.periodCode, tb.period.id);
      console.log('Opening:', tb.openingDebit);
      console.log('Period:', tb.periodDebit);
      console.log('Ending:', tb.endingDebit);
  } else {
      console.log('Record NOT Found.');
  }
}

checkSpecificId()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
