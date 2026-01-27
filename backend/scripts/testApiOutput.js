import { prisma } from '../src/config/db.js';

async function test() {
    const coas = await prisma.chartOfAccounts.findMany({
        take: 5,
        orderBy: { code: 'asc' },
        select: {
            id: true,
            code: true,
            parentId: true,
            parent: {
                select: {
                    id: true,
                    code: true
                }
            }
        }
    });

    console.log(JSON.stringify(coas, null, 2));
    await prisma.$disconnect();
}

test().catch(console.error);
