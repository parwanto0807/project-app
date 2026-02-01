import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function listAll() {
    try {
        const coa = await prisma.chartOfAccounts.findUnique({
            where: { code: '4-10101' }
        });

        console.log(`Listing all transactions for ${coa.code}:`);
        
        const lines = await prisma.ledgerLine.findMany({
            where: { coaId: coa.id },
            include: { ledger: true },
            orderBy: { ledger: { transactionDate: 'desc' } }
        });

        lines.forEach(l => {
            console.log(`[${l.ledger.transactionDate.toISOString()}] ${l.creditAmount || -l.debitAmount} | Ref: ${l.ledger.referenceNumber}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listAll();
