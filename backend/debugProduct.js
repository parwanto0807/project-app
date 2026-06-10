import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findUnique({
    where: { code: 'PRD-99E60EF7' },
    include: {
      stockBalances: true,
      stockDetails: true,
      GoodsReceiptItem: {
        include: {
          stockDetail: true
        }
      },
      PurchaseOrderLine: true,
      purchaseRequestDetail: true
    }
  });
  console.log(JSON.stringify(product, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
