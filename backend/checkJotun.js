import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const p = await prisma.product.findFirst({
        where: { name: { contains: 'Jotaplast' } }
    });
    console.log(p);
}

main().finally(() => prisma.$disconnect());
