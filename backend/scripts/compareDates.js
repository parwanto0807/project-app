import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function compareDates() {
    try {
        const ref = '00063/INV-RYLIF/I/2026';
        const invoice = await prisma.invoice.findFirst({ where: { invoiceNumber: ref } });
        const ledger = await prisma.ledger.findFirst({ where: { referenceNumber: ref } });

        console.log(`Reference: ${ref}`);
        if (invoice) {
            console.log(`Invoice Date (UTC): ${invoice.invoiceDate.toISOString()}`);
        }
        if (ledger) {
            console.log(`Ledger Date (UTC):  ${ledger.transactionDate.toISOString()}`);
            console.log(`Ledger Created At: ${ledger.createdAt.toISOString()}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

compareDates();
