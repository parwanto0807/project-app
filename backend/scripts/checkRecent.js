import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkRecent() {
    try {
        const coa = await prisma.chartOfAccounts.findUnique({
            where: { code: '4-10101' }
        });

        console.log(`Checking COA: ${coa.code}`);

        const transactions = await prisma.ledgerLine.findMany({
            where: {
                coaId: coa.id,
                ledger: {
                    transactionDate: {
                        gte: new Date('2026-01-30T00:00:00.000Z')
                    }
                }
            },
            include: {
                ledger: true
            },
            orderBy: {
                ledger: {
                    transactionDate: 'desc'
                }
            }
        });

        console.log(`Summary of recent transactions for 4-10101:`);
        transactions.forEach(t => {
            console.log(`[${t.ledger.transactionDate.toISOString()}] Cr: ${t.creditAmount} | Dr: ${t.debitAmount} | Ref: ${t.ledger.referenceNumber} | Desc: ${t.ledger.description}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecent();
