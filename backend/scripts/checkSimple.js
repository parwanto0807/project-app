import { prisma } from '../src/config/db.js';

async function check() {
    const c = await prisma.chartOfAccounts.findUnique({
        where: { code: '1-10001' }
    });
    console.log('1-10001 ParentId:', c.parentId);
    await prisma.$disconnect();
}

check().catch(console.error);
