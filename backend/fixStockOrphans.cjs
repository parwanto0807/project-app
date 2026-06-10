const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const period = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const balances = await prisma.stockBalance.findMany({where: {period}});
  
  let fixedCount = 0;
  for (let bal of balances) {
    // Recalculate total booked
    const prs = await prisma.purchaseRequestDetail.findMany({
      where: {
        productId: bal.productId,
        purchaseRequest: {status: {notIn: ['DRAFT', 'REJECTED', 'REVISION_NEEDED', 'COMPLETED']}},
        warehouseAllocation: {not: null}
      },
      include: {product: true}
    });

    let totalBooked = 0;
    prs.forEach(pr => {
      let allocs=[];
      try {
        allocs = typeof pr.warehouseAllocation==='string' ? JSON.parse(pr.warehouseAllocation) : pr.warehouseAllocation;
      } catch(e){}
      
      const prRemaining = Number(pr.jumlah) - Number(pr.jumlahDipesan||0);
      if(prRemaining>0 && allocs) {
        allocs.forEach(a => {
          if (a.warehouseId === bal.warehouseId) {
            let b = Math.min(Number(a.allocatedQty||0), prRemaining);
            let c = 1;
            if(pr.product && pr.unit !== pr.product.storageUnit) c=Number(pr.product.conversionToStorage)||1;
            totalBooked += b*c;
          }
        });
      }
    });

    // Recalculate total on PO
    const pos = await prisma.purchaseOrderLine.findMany({
      where: {
        productId: bal.productId,
        purchaseOrder: {
          status: {in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED']},
          warehouseId: bal.warehouseId
        }
      },
      include: {product: true}
    });

    let totalOnPO = 0;
    pos.forEach(po => {
      const rem = Number(po.quantity) - Number(po.receivedQuantity||0);
      if (rem>0) {
        let c = 1;
        if(po.unit !== po.product.storageUnit) c=Number(po.product.conversionToStorage)||1;
        totalOnPO += rem*c;
      }
    });

    if (bal.bookedStock.toNumber() !== totalBooked || bal.onPR.toNumber() !== totalOnPO) {
      console.log(`Fixing product ${bal.productId} Booked: ${bal.bookedStock.toNumber()} -> ${totalBooked}, OnPO: ${bal.onPR.toNumber()} -> ${totalOnPO}`);
      await prisma.stockBalance.update({
        where: {id: bal.id},
        data: {bookedStock: totalBooked, onPR: totalOnPO}
      });
      fixedCount++;
    }
  }
  
  console.log(`Finished fixing. Updated ${fixedCount} records.`);
}

fix().finally(() => prisma.$disconnect());
