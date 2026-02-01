import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkId() {
  const idToCheck = 'c115cabf'; // partial or full? user said ID: c115cabf. Usually UUIDs are longer.
  // Assuming it's a UUID, it should be longer. But maybe user truncated it?
  // Let's search with 'contains' if possible, or just exact if user provided full.
  // UUIDs are 36 chars. 'c115cabf' is 8 chars.
  
  console.log(`Checking for ID starting with ${idToCheck}...`);

  const tb = await prisma.trialBalance.findFirst({
    where: { id: { startsWith: idToCheck } },
    include: { coa: true, period: true }
  });

  if (tb) {
      console.log('Record Found:');
      console.log(JSON.stringify(tb, null, 2));
  } else {
      console.log('Record NOT Found.');
  }
}

checkId()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
