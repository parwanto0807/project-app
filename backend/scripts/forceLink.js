import { prisma } from '../src/config/db.js';

async function forceLink() {
    const parent = await prisma.chartOfAccounts.findUnique({ where: { code: '6-10200' } });
    if (!parent) {
        console.error('Parent 6-10200 not found');
        return;
    }
    
    console.log(`Found parent: ${parent.name} (${parent.id})`);
    
    const result = await prisma.chartOfAccounts.update({
        where: { code: '6-10202' },
        data: { parentId: parent.id }
    });
    
    console.log('Update result for 6-10202:', JSON.stringify(result, null, 2));
    
    // Also try 6-10206
    const result2 = await prisma.chartOfAccounts.update({
        where: { code: '6-10206' },
        data: { parentId: parent.id }
    });
    console.log('Update result for 6-10206:', JSON.stringify(result2, null, 2));

    await prisma.$disconnect();
}

forceLink().catch(console.error);
