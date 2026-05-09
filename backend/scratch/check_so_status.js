import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSO() {
  const soNumber = '0003/RYLIF-SO/IV/2026';
  console.log(`Checking Sales Order: ${soNumber}`);

  const so = await prisma.salesOrder.findUnique({
    where: { soNumber },
    include: {
      invoices: true,
      spk: true
    }
  });

  if (!so) {
    console.log('Sales Order not found');
    return;
  }

  console.log('--- Sales Order Data ---');
  console.log(`ID: ${so.id}`);
  console.log(`Current Status: ${so.status}`);
  
  console.log('\n--- Related Invoices ---');
  if (so.invoices.length === 0) {
    console.log('No invoices found');
  } else {
    so.invoices.forEach(inv => {
      console.log(`- Invoice: ${inv.invoiceNumber}`);
      console.log(`  Status: ${inv.status}`);
      console.log(`  Balance Due: ${inv.balanceDue}`);
    });
  }

  console.log('\n--- Related SPKs ---');
  if (so.spk.length === 0) {
    console.log('No SPKs found');
  } else {
    so.spk.forEach(s => {
      console.log(`- SPK: ${s.spkNumber}`);
      console.log(`  spkStatus (Finished): ${s.spkStatus}`);
      console.log(`  spkStatusClose (Closed): ${s.spkStatusClose}`);
    });
  }

  // Determine what it SHOULD be
  let targetStatus = so.status;
  if (so.invoices.length > 0) {
    const allPaid = so.invoices.every(inv => inv.status === 'PAID');
    const anyPaid = so.invoices.some(inv => inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID');
    
    if (allPaid) {
      targetStatus = 'PAID';
    } else if (anyPaid) {
      targetStatus = 'PARTIALLY_PAID';
    } else {
      targetStatus = 'INVOICED';
    }
  }

  console.log('\n--- Analysis ---');
  console.log(`Based on our new logic, the Sales Order status should be: ${targetStatus}`);
  if (targetStatus === 'PAID') {
    console.log('All related SPKs should be Closed (spkStatusClose: true).');
  }
}

checkSO()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
