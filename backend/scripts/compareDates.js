import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function compareDates() {
    try {
        const ref = '00063/INV-RYLIF/I/2026';
        const invoice = await prisma.invoice.findFirst({ where: { invoiceNumber: ref } });
        const ledger = await prisma.ledger.findFirst({ where: { referenceNumber: ref } });

        (() => {})(`Reference: ${ref}`);
        if (invoice) {
            (() => {})(`Invoice Date (UTC): ${invoice.invoiceDate.toISOString()}`);
        }
        if (ledger) {
            (() => {})(`Ledger Date (UTC):  ${ledger.transactionDate.toISOString()}`);
            (() => {})(`Ledger Created At: ${ledger.createdAt.toISOString()}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

compareDates();
