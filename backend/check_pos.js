
import { PrismaClient } from './prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
  const latestPOs = await prisma.purchaseOrder.findMany({
    orderBy: { poNumber: 'desc' },
    take: 20,
    select: { poNumber: true, orderDate: true }
  });

  console.log('Latest 20 POs (by poNumber desc):');
  latestPOs.forEach(po => console.log(`${po.poNumber} (${po.orderDate})`));

  const thisYear = new Date().getFullYear();
  const startOfYear = new Date(thisYear, 0, 1);
  const endOfYear = new Date(thisYear, 11, 31, 23, 59, 59);

  const yearPOs = await prisma.purchaseOrder.findMany({
    where: {
      orderDate: {
        gte: startOfYear,
        lte: endOfYear
      }
    },
    orderBy: { poNumber: 'desc' },
    take: 10,
    select: { poNumber: true }
  });

  console.log(`\nPO numbers in ${thisYear}:`);
  yearPOs.forEach(po => console.log(po.poNumber));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
