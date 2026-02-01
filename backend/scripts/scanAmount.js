import { PrismaClient } from '../prisma/generated/prisma/index.js';
import { getJakartaStartOfDay, getJakartaEndOfDay } from '../src/utils/dateUtils.js';
const prisma = new PrismaClient();

async function findAmount() {
    try {
        const startDate = new Date('2026-02-01');
        const endDate = new Date('2026-02-28');

        const dbStart = getJakartaStartOfDay(startDate);
        const dbEnd = getJakartaEndOfDay(endDate);

        console.log(`Searching for any transaction with amount 1,250,000 in Feb:`);

        const transactions = await prisma.ledgerLine.findMany({
            where: {
                OR: [
                    { debitAmount: 1250000 },
                    { creditAmount: 1250000 }
                ],
                ledger: {
                    transactionDate: {
                        gte: dbStart,
                        lte: dbEnd
                    },
                    status: 'POSTED'
                }
            },
            include: {
                ledger: true,
                coa: true
            }
        });

        console.log(`Found ${transactions.length} matches.`);
        
        transactions.forEach(t => {
            console.log(`- COA: ${t.coa.code} (${t.coa.name})`);
            console.log(`  Date (UTC): ${t.ledger.transactionDate.toISOString()}`);
            console.log(`  Amount: Cr ${t.creditAmount} / Dr ${t.debitAmount}`);
            console.log(`  Desc: ${t.description || t.ledger.description}`);
            console.log(`  Ledger Num: ${t.ledger.ledgerNumber}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

findAmount();
