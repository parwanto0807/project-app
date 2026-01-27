import { prisma } from '../src/config/db.js';

async function check() {
    const codes = ['1-10000', '1-10001', '1-10100', '1-10200', '1-10202'];
    const coas = await prisma.chartOfAccounts.findMany({
        where: { code: { in: codes } },
        include: { parent: true }
    });
    
    console.log('--- Account Parental Check ---');
    coas.forEach(c => {
        console.log(`${c.code} (${c.postingType}): Parent -> ${c.parent ? c.parent.code : 'NULL'} (parentId: ${c.parentId})`);
    });
    
    await prisma.$disconnect();
}

check().catch(console.error);
