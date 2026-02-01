import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function findGlobally() {
    try {
        console.log(`Searching for any ledger line with amount 1,250,000 created today/yesterday:`);
        
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

        console.log(`Found ${lines.length} lines.`);
        lines.forEach(l => {
            console.log(`- COA: ${l.coa.code} (${l.coa.name})`);
            console.log(`  Date: ${l.ledger.transactionDate.toISOString()}`);
            console.log(`  Amount: ${l.debitAmount || l.creditAmount}`);
            console.log(`  Desc: ${l.ledger.description}`);
            console.log(`  Ref: ${l.ledger.referenceNumber}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

findGlobally();
