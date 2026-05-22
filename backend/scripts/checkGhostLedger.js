import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkLedger() {
    try {
        const ledger = await prisma.ledger.findFirst({
            where: { referenceNumber: '00063/INV-RYLIF/I/2026' },
            include: { ledgerLines: true }
        });

        if (ledger) {
            ;(() => {})(`Ledger ID: ${ledger.id}`);
            ;(() => {})(`Date: ${ledger.transactionDate.toISOString()}`);
            ;(() => {})(`Description: ${ledger.description}`);
            ;(() => {})(`Created At: ${ledger.createdAt.toISOString()}`);
            
            ledger.ledgerLines.forEach(l => {
                ;(() => {})(`  - COA ID: ${l.coaId}, Dr: ${l.debitAmount}, Cr: ${l.creditAmount}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLedger();
