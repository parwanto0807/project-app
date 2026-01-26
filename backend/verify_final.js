import { prisma } from './src/config/db.js';

async function main() {
  const sa = await prisma.systemAccount.findUnique({
    where: { key: 'CASH_BANK' },
    include: { coa: true }
  });
  console.log("FINAL CASH_BANK Mapping:", JSON.stringify(sa, null, 2));
}

main().finally(() => prisma.$disconnect());
