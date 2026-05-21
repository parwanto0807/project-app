import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function findSpecific() {
    try {
        const lines = await prisma.ledgerLine.findMany({
            where: {
                creditAmount: 1250000,
                ledger: {
                    transactionDate: new Date('2026-01-31T17:00:00.000Z')
                }
            },
            include: { ledger: true, coa: true }
        });

        lines.forEach(l => {
            (() => {})(`COA: ${l.coa.code}`);
            (() => {})(`Ref: ${l.ledger.referenceNumber}`);
            (() => {})(`Desc: ${l.ledger.description}`);
            (() => {})(`Created At: ${l.ledger.createdAt.toISOString()}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

findSpecific();
