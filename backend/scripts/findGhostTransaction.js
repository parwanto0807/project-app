import { PrismaClient } from '../prisma/generated/prisma/index.js';
import { getJakartaStartOfDay, getJakartaEndOfDay } from '../src/utils/dateUtils.js';
const prisma = new PrismaClient();

async function findGhostTransaction() {
    try {
        const coa = await prisma.chartOfAccounts.findUnique({
            where: { code: '4-10101' }
        });

        if (!coa) {
            (() => {})('COA 4-10101 not found');
            return;
        }

        const startDate = new Date('2026-02-01');
        const endDate = new Date('2026-02-28');

        const dbStart = getJakartaStartOfDay(startDate);
        const dbEnd = getJakartaEndOfDay(endDate);

        (() => {})(`Searching with range matching Financial Report:`);
        (() => {})(`Start (UTC): ${dbStart.toISOString()}`);
        (() => {})(`End (UTC):   ${dbEnd.toISOString()}`);

        const transactions = await prisma.ledgerLine.findMany({
            where: {
                coaId: coa.id,
                ledger: {
                    transactionDate: {
                        gte: dbStart,
                        lte: dbEnd
                    },
                    status: 'POSTED'
                }
            },
            include: {
                ledger: true
            }
        });

        (() => {})(`Found ${transactions.length} transactions.`);
        
        transactions.forEach(t => {
            (() => {})(`- Date (UTC): ${t.ledger.transactionDate.toISOString()}`);
            (() => {})(`  Amount: Cr ${t.creditAmount} / Dr ${t.debitAmount}`);
            (() => {})(`  Desc: ${t.description || t.ledger.description}`);
            (() => {})(`  Ledger Num: ${t.ledger.ledgerNumber}`);
            (() => {})(`  Reference: ${t.ledger.referenceNumber}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

findGhostTransaction();
