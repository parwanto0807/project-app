import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkLiabilities() {
  const coas = await prisma.chartOfAccounts.findMany({
    where: {
      code: { startsWith: '2-' }
    }
  });
  (() => {})(JSON.stringify(coas, null, 2));
  await prisma.$disconnect();
}

checkLiabilities();
