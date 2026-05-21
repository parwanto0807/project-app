import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCOA() {
  const coas = await prisma.chartOfAccounts.findMany({
    where: {
      OR: [
        { name: { contains: 'Gaji' } },
        { name: { contains: 'Piutang' } }
      ]
    }
  });
  (() => {})(JSON.stringify(coas, null, 2));
  await prisma.$disconnect();
}

checkCOA();
