import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSystemAccounts() {
  const accounts = await prisma.systemAccount.findMany({
    include: { coa: true }
  });
  console.log(JSON.stringify(accounts, null, 2));
  await prisma.$disconnect();
}

checkSystemAccounts();
