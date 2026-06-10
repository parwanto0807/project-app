import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const stockDetails = await prisma.stockDetail.findMany({
    where: { productId: '018add08-1867-4796-a939-f0f5038c3adc' }
  });
  console.log('STOCK DETAILS:');
  console.log(JSON.stringify(stockDetails, null, 2));

  const stockBalances = await prisma.stockBalance.findMany({
    where: { productId: '018add08-1867-4796-a939-f0f5038c3adc' }
  });
  console.log('STOCK BALANCES:');
  console.log(JSON.stringify(stockBalances, null, 2));

  const goodsReceiptItems = await prisma.goodsReceiptItem.findMany({
    where: { productId: '018add08-1867-4796-a939-f0f5038c3adc' },
    include: { stockDetail: true, goodsReceipt: true }
  });
  console.log('GOODS RECEIPTS:');
  console.log(JSON.stringify(goodsReceiptItems, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
