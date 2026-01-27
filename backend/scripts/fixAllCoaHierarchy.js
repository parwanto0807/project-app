import { prisma } from '../src/config/db.js';

async function fixHierarchy() {
    const allCoas = await prisma.chartOfAccounts.findMany();
    const coaMap = new Map(allCoas.map(coa => [coa.code, coa]));
    
    console.log(`Analyzing ${allCoas.length} accounts...`);
    let updatedCount = 0;

    for (const coa of allCoas) {
        const parts = coa.code.split('-');
        if (parts.length < 2) continue;
        
        const prefix = parts[0];
        const numStr = parts[1];
        let parentCode = null;

        // Gradual zeroing: 10202 -> 10200 -> 10000 -> 00000
        for (let i = numStr.length - 1; i >= 0; i--) {
            if (numStr[i] !== '0') {
                const candidateNum = numStr.substring(0, i) + '0'.repeat(numStr.length - i);
                const candidate = `${prefix}-${candidateNum}`;
                
                if (coaMap.has(candidate) && candidate !== coa.code) {
                    parentCode = candidate;
                    break;
                }
            }
        }

        if (parentCode) {
            const parent = coaMap.get(parentCode);
            if (coa.parentId !== parent.id) {
                await prisma.chartOfAccounts.update({
                    where: { id: coa.id },
                    data: { parentId: parent.id }
                });
                updatedCount++;
                console.log(`Linked ${coa.code} -> ${parent.code}`);
            }
        }
    }

    console.log(`\n✅ Done! Updated ${updatedCount} accounts.`);
    await prisma.$disconnect();
}

fixHierarchy().catch(console.error);
