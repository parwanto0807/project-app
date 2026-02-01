import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkAllLines() {
    try {
        const ref = '00063/INV-RYLIF/I/2026';
        const ledger = await prisma.ledger.findFirst({
            where: { referenceNumber: ref },
            include: { ledgerLines: { include: { coa: true } } }
        });

        if (ledger) {
            console.log(`Ledger: ${ledger.ledgerNumber} | Date: ${ledger.transactionDate.toISOString()}`);
            ledger.ledgerLines.forEach(l => {
                console.log(`  - ${l.coa.code} (${l.coa.name}) | Dr: ${l.debitAmount} | Cr: ${l.creditAmount}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllLines();
