import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkInvoice() {
    try {
        const invoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: '00063/INV-RYLIF/I/2026' }
        });

        if (invoice) {
            console.log(`Invoice ID: ${invoice.id}`);
            console.log(`Date: ${invoice.invoiceDate.toISOString()}`);
            console.log(`Total: ${invoice.totalAmount}`);
            console.log(`Created At: ${invoice.createdAt.toISOString()}`);
            console.log(`Created By: ${invoice.createdById}`);
        } else {
            console.log('Invoice not found');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkInvoice();
