import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSO() {
  const soNumber = '0003/RYLIF-SO/IV/2026';
  ;(() => {})(`Checking Sales Order: ${soNumber}`);

  const so = await prisma.salesOrder.findUnique({
    where: { soNumber },
    include: {
      invoices: true,
      spk: true
    }
  });

  if (!so) {
    ;(() => {})('Sales Order not found');
    return;
  }

  ;(() => {})('--- Sales Order Data ---');
  ;(() => {})(`ID: ${so.id}`);
  ;(() => {})(`Current Status: ${so.status}`);
  
  ;(() => {})('\n--- Related Invoices ---');
  if (so.invoices.length === 0) {
    ;(() => {})('No invoices found');
  } else {
    so.invoices.forEach(inv => {
      ;(() => {})(`- Invoice: ${inv.invoiceNumber}`);
      ;(() => {})(`  Status: ${inv.status}`);
      ;(() => {})(`  Balance Due: ${inv.balanceDue}`);
    });
  }

  ;(() => {})('\n--- Related SPKs ---');
  if (so.spk.length === 0) {
    ;(() => {})('No SPKs found');
  } else {
    so.spk.forEach(s => {
      ;(() => {})(`- SPK: ${s.spkNumber}`);
      ;(() => {})(`  spkStatus (Finished): ${s.spkStatus}`);
      ;(() => {})(`  spkStatusClose (Closed): ${s.spkStatusClose}`);
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

  ;(() => {})('\n--- Analysis ---');
  ;(() => {})(`Based on our new logic, the Sales Order status should be: ${targetStatus}`);
  if (targetStatus === 'PAID') {
    ;(() => {})('All related SPKs should be Closed (spkStatusClose: true).');
  }
}

checkSO()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
