import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function findGlobally() {
    try {
        (() => {})(`Searching for any ledger line with amount 1,250,000 created today/yesterday:`);
        
        const lines = await prisma.ledgerLine.findMany({
            where: {
                OR: [
                    { debitAmount: 1250000 },
                    { creditAmount: 1250000 }
                ],
                createdAt: {
                    gte: new Date('2026-02-01T00:00:00.000Z')
                }
            },
            include: {
                ledger: true,
                coa: true
            }
        });

        (() => {})(`Found ${lines.length} lines.`);
        lines.forEach(l => {
            (() => {})(`- COA: ${l.coa.code} (${l.coa.name})`);
            (() => {})(`  Date: ${l.ledger.transactionDate.toISOString()}`);
            (() => {})(`  Amount: ${l.debitAmount || l.creditAmount}`);
            (() => {})(`  Desc: ${l.ledger.description}`);
            (() => {})(`  Ref: ${l.ledger.referenceNumber}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

findGlobally();
