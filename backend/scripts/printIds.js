import { prisma } from "../src/config/db.js";

async function checkIds() {
  const ps = await prisma.accountingPeriod.findMany({
    orderBy: { startDate: 'asc' },
    select: { id: true, periodCode: true, periodName: true, startDate: true }
  });
  console.log('PERIODS:');
  ps.forEach(p => {
    console.log(`${p.id} | ${p.periodCode} | ${p.periodName} | ${p.startDate.toISOString()}`);
  });
}

checkIds().finally(() => prisma.$disconnect());
