import { prisma } from './src/config/db.js';

async function main() {
  const accounts = await prisma.chartOfAccounts.findMany({
    where: {
      code: { startsWith: '5-' }
    },
    select: {
      code: true,
      name: true
    },
    orderBy: { code: 'asc' }
  });
  console.log(JSON.stringify(accounts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
