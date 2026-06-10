import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const p = await prisma.product.findFirst({
        where: { code: 'PRD-99E60EF7' }
    });
    console.log(p);
}

main().finally(() => prisma.$disconnect());
