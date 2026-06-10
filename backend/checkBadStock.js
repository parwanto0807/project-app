import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const details = await prisma.stockDetail.findMany({
        include: { product: true }
    });

    const badDetails = details.filter(d => {
        if (!d.product) return false;
        if (d.transUnit === d.product.usageUnit && d.product.usageUnit !== d.product.storageUnit) {
            const expectedBaseQty = Number(d.transQty) / Number(d.product.conversionToUsage);
            return Number(d.baseQty) !== expectedBaseQty;
        }
        return false;
    });

    console.log(`Found ${badDetails.length} bad details.`);
    badDetails.forEach(d => {
        console.log(`ID: ${d.id}, Type: ${d.type}, transQty: ${d.transQty} ${d.transUnit}, baseQty: ${d.baseQty}, expected: ${Number(d.transQty) / Number(d.product.conversionToUsage)}, Warehouse: ${d.warehouseId}`);
    });
}

main().finally(() => prisma.$disconnect());
