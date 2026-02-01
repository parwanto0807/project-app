import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function compareStockPeriods() {
    try {
        console.log('='.repeat(60));
        console.log('COMPARING STOCK BALANCE: JANUARY vs FEBRUARY');
        console.log('='.repeat(60));

        const janStart = new Date('2026-01-01T00:00:00.000Z');
        const febStart = new Date('2026-02-01T00:00:00.000Z');

        // Count records
        const janCount = await prisma.stockBalance.count({
            where: { period: janStart }
        });

        const febCount = await prisma.stockBalance.count({
            where: { period: febStart }
        });

        console.log(`\n📊 RECORD COUNTS:`);
        console.log(`   January:  ${janCount} records`);
        console.log(`   February: ${febCount} records`);
        console.log(`   Difference: ${febCount - janCount} records`);

        // Get product-warehouse combinations in Jan
        const janRecords = await prisma.stockBalance.findMany({
            where: { period: janStart },
            select: { productId: true, warehouseId: true }
        });

        const janCombos = new Set(janRecords.map(r => `${r.productId}-${r.warehouseId}`));

        // Get product-warehouse combinations in Feb
        const febRecords = await prisma.stockBalance.findMany({
            where: { period: febStart },
            select: { productId: true, warehouseId: true, stockAwal: true, stockAkhir: true }
        });

        const febCombos = new Set(febRecords.map(r => `${r.productId}-${r.warehouseId}`));

        // Find records only in Feb (not in Jan)
        const onlyInFeb = febRecords.filter(r => 
            !janCombos.has(`${r.productId}-${r.warehouseId}`)
        );

        console.log(`\n🔍 RECORDS ONLY IN FEBRUARY (not in January):`);
        console.log(`   Count: ${onlyInFeb.length} records`);

        if (onlyInFeb.length > 0) {
            console.log(`\n   Sample (first 10):`);
            const samples = await prisma.stockBalance.findMany({
                where: {
                    period: febStart,
                    OR: onlyInFeb.slice(0, 10).map(r => ({
                        productId: r.productId,
                        warehouseId: r.warehouseId
                    }))
                },
                include: {
                    product: { select: { code: true, name: true } },
                    warehouse: { select: { name: true } }
                }
            });

            samples.forEach((s, i) => {
                console.log(`   ${i + 1}. ${s.product.code} - ${s.product.name}`);
                console.log(`      Warehouse: ${s.warehouse.name}`);
                console.log(`      Stock: Awal=${s.stockAwal}, Akhir=${s.stockAkhir}`);
            });
        }

        // Find records only in Jan (not in Feb)
        const onlyInJan = janRecords.filter(r => 
            !febCombos.has(`${r.productId}-${r.warehouseId}`)
        );

        console.log(`\n🔍 RECORDS ONLY IN JANUARY (not in February):`);
        console.log(`   Count: ${onlyInJan.length} records`);

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

compareStockPeriods();
