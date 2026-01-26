import { prisma } from './src/config/db.js';

async function main() {
  const bankAccounts = await prisma.chartOfAccounts.findMany({
    where: {
      OR: [
        { name: { contains: 'Bank', mode: 'insensitive' } },
        { name: { contains: 'Kas', mode: 'insensitive' } }
      ]
    },
    select: { code: true, name: true }
  });
  console.log(JSON.stringify(bankAccounts, null, 2));
}

main().finally(() => prisma.$disconnect());
