import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAccount() {
  const coa = await prisma.chartOfAccounts.findUnique({
    where: { id: 'c6a27d2d-cb13-4f83-902d-ffd960d0f3ac' }
  });
  console.log(JSON.stringify(coa, null, 2));
  await prisma.$disconnect();
}

checkAccount();
