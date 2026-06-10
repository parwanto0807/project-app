const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findUnique({where:{code:'PRD-CD9A4FF6'}});
  const prs = await prisma.purchaseRequestDetail.findMany({
    where: {productId: p.id, purchaseRequest: {status: {notIn: ['DRAFT', 'REJECTED', 'REVISION_NEEDED']}}},
    include: {purchaseRequest: true}
  });
  console.log('PRs:');
  prs.forEach(pr => console.log(pr.purchaseRequest.status, pr.jumlah, pr.jumlahDipesan, pr.jumlahTerpenuhi, pr.warehouseAllocation));
  
  const pos = await prisma.purchaseOrderLine.findMany({
    where: {productId: p.id, purchaseOrder: {status: {in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED']}}},
    include: {purchaseOrder: true}
  });
  console.log('POs:');
  pos.forEach(po => console.log(po.purchaseOrder.status, po.quantity, po.receivedQuantity));
}
main().finally(() => {
  prisma.$disconnect().catch(() => {});
});
