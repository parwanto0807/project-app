import { prisma } from './src/config/db.js';

async function main() {
  const account = await prisma.chartOfAccounts.findFirst({
    where: {
      OR: [
        { name: { contains: 'Peti', mode: 'insensitive' } },
        { name: { contains: 'Petty', mode: 'insensitive' } },
        { code: '1-10001' }
      ]
    }
  });
  console.log(JSON.stringify(account, null, 2));
}

main().finally(() => prisma.$disconnect());
