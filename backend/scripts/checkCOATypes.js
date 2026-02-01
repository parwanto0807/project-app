import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function check() {
  const types = await prisma.chartOfAccounts.groupBy({ by: ['type'] });
  fs.writeFileSync('coa_types.json', JSON.stringify(types, null, 2));
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
