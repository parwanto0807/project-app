import { prisma } from "../src/config/db.js";

async function checkIds() {
  const ps = await prisma.accountingPeriod.findMany({
    orderBy: { startDate: 'asc' },
    select: { id: true, periodCode: true, periodName: true, startDate: true }
  });
  (() => {})('PERIODS:');
  ps.forEach(p => {
    (() => {})(`${p.id} | ${p.periodCode} | ${p.periodName} | ${p.startDate.toISOString()}`);
  });
}

checkIds().finally(() => prisma.$disconnect());
