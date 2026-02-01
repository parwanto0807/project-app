import { prisma } from "../src/config/db.js";
import fs from 'fs';

async function checkFebInventoryTB() {
  const febPeriodId = "fb69998f-7af7-43ab-abfc-468dbd83f7ea";
  
  const tb = await prisma.trialBalance.findMany({
    where: { periodId: febPeriodId },
    include: { coa: true }
  });

  const filtered = tb.filter(t => t.coa.code.startsWith('1-1020'));

  fs.writeFileSync('all_inventory_tb_feb.json', JSON.stringify(filtered, null, 2));
}

checkFebInventoryTB()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
