const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findUnique({where:{code:'PRD-CD9A4FF6'}});
  await prisma.stockBalance.updateMany({
    where: {productId: p.id, warehouseId: 'be4213dc-06a3-4fe3-9fb8-0ce429452095', period: new Date('2026-06-01T00:00:00.000Z')},
    data: {bookedStock: 0, onPR: 0}
  });
  console.log('Updated PRD-CD9A4FF6 bookedStock and onPR to 0!');
}
main().finally(() => {
  prisma.$disconnect().catch(() => {});
});
