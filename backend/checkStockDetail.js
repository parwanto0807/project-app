import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const s = await prisma.stockDetail.findMany({
        where: { productId: '018add08-1867-4796-a939-f0f5038c3adc' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log("Stock Details:", s);

    const bal = await prisma.stockBalance.findFirst({
        where: { productId: '018add08-1867-4796-a939-f0f5038c3adc' },
        orderBy: { period: 'desc' }
    });
    console.log("Stock Balance:", bal);
}

main().finally(() => prisma.$disconnect());
