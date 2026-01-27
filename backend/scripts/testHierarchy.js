import { prisma } from '../src/config/db.js';

async function testHierarchy() {
    const rootAccounts = await prisma.chartOfAccounts.findMany({
        where: {
            parentId: null,
            status: 'ACTIVE'
        },
        include: {
            children: {
                include: {
                    children: true
                }
            }
        },
        orderBy: { code: 'asc' }
    });

    console.log(`Found ${rootAccounts.length} root accounts.`);
    
    rootAccounts.slice(0, 5).forEach(root => {
        console.log(`\n- ${root.code} ${root.name} (${root.children.length} children)`);
        root.children.forEach(child => {
            console.log(`  └─ ${child.code} ${child.name} (${child.children.length} children)`);
        });
    });

    await prisma.$disconnect();
}

testHierarchy();
