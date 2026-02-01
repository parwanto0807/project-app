import { PrismaClient } from '../prisma/generated/prisma/index.js';
import fs from 'fs';
const prisma = new PrismaClient();

async function searchAmount() {
    try {
        const lines = await prisma.ledgerLine.findMany({
            where: {
                OR: [
                    { debitAmount: 1250000 },
                    { creditAmount: 1250000 }
                ]
            },
            include: {
                ledger: true,
                coa: true
            }
        });

        let output = `Found ${lines.length} lines.\n`;
        lines.forEach(l => {
            output += `- COA: ${l.coa.code} (${l.coa.name})\n`;
            output += `  Date: ${l.ledger.transactionDate.toISOString()}\n`;
            output += `  Amount: ${l.debitAmount || l.creditAmount}\n`;
            output += `  Ref: ${l.ledger.referenceNumber}\n`;
        });

        fs.writeFileSync('scripts/scan_result.txt', output);
        console.log('Done');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

searchAmount();
