import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncAllStatuses() {
  console.log('🚀 Starting bulk status synchronization...');
  
  const salesOrders = await prisma.salesOrder.findMany({
    include: {
      invoices: {
        where: {
          status: { not: 'CANCELLED' }
        }
      },
      spk: true
    }
  });

  console.log(`Found ${salesOrders.length} Sales Orders to check.`);

  let updatedCount = 0;
  let spkClosedCount = 0;

  for (const so of salesOrders) {
    let targetStatus = null;

    if (so.invoices.length > 0) {
      const allPaid = so.invoices.every(inv => inv.status === 'PAID');
      const anyPaid = so.invoices.some(inv => inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID');
      const anyUnpaid = so.invoices.some(inv => ['UNPAID', 'APPROVED', 'WAITING_APPROVAL'].includes(inv.status));

      if (allPaid) {
        targetStatus = 'PAID';
      } else if (anyPaid) {
        targetStatus = 'PARTIALLY_PAID';
      } else if (anyUnpaid) {
        targetStatus = 'INVOICED';
      }
    }

    // Only update if status needs changing
    if (targetStatus && so.status !== targetStatus) {
      console.log(`Updating SO ${so.soNumber}: ${so.status} -> ${targetStatus}`);
      await prisma.salesOrder.update({
        where: { id: so.id },
        data: { status: targetStatus }
      });
      updatedCount++;

      // If target is PAID, close SPKs if they aren't already
      if (targetStatus === 'PAID') {
        const result = await prisma.sPK.updateMany({
          where: { 
            salesOrderId: so.id,
            OR: [
              { spkStatus: false },
              { spkStatusClose: false }
            ]
          },
          data: { 
            spkStatus: true,
            spkStatusClose: true 
          }
        });
        if (result.count > 0) {
          console.log(`  - Closed ${result.count} SPKs for this SO.`);
          spkClosedCount += result.count;
        }
      }
    }
  }

  console.log('\n✅ Synchronization complete!');
  console.log(`Total Sales Orders updated: ${updatedCount}`);
  console.log(`Total SPKs closed: ${spkClosedCount}`);
}

syncAllStatuses()
  .catch(e => {
    console.error('❌ Error during sync:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
