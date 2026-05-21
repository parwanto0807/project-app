import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkInvoice() {
    try {
        const invoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: '00063/INV-RYLIF/I/2026' }
        });

        if (invoice) {
            (() => {})(`Invoice ID: ${invoice.id}`);
            (() => {})(`Date: ${invoice.invoiceDate.toISOString()}`);
            (() => {})(`Total: ${invoice.totalAmount}`);
            (() => {})(`Created At: ${invoice.createdAt.toISOString()}`);
            (() => {})(`Created By: ${invoice.createdById}`);
        } else {
            (() => {})('Invoice not found');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkInvoice();
