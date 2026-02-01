import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkAndCleanStockData() {
    try {
        console.log('='.repeat(60));
        console.log('STOCK BALANCE DATA CHECK');
        console.log('='.repeat(60));

        // 1. Cek data Januari
        const janCount = await prisma.stockBalance.count({
            where: { period: new Date('2026-01-01') }
        });
        
        const janData = await prisma.stockBalance.aggregate({
            where: { period: new Date('2026-01-01') },
            _sum: {
                stockAkhir: true,
                inventoryValue: true
            }
        });

        console.log('\n📅 JANUARI 2026:');
        console.log(`   Total Records: ${janCount}`);
        console.log(`   Total Stock Akhir: ${janData._sum.stockAkhir || 0}`);
        console.log(`   Total Inventory Value: Rp ${(janData._sum.inventoryValue || 0).toLocaleString('id-ID')}`);

        // 2. Cek data Februari
        const febCount = await prisma.stockBalance.count({
            where: { period: new Date('2026-02-01') }
        });
        
        const febData = await prisma.stockBalance.aggregate({
            where: { period: new Date('2026-02-01') },
            _sum: {
                stockAkhir: true,
                inventoryValue: true
            }
        });

        console.log('\n📅 FEBRUARI 2026:');
        console.log(`   Total Records: ${febCount}`);
        console.log(`   Total Stock Akhir: ${febData._sum.stockAkhir || 0}`);
        console.log(`   Total Inventory Value: Rp ${(febData._sum.inventoryValue || 0).toLocaleString('id-ID')}`);

        // 3. Lihat sample data Januari
        if (janCount > 0) {
            console.log('\n📦 SAMPLE DATA JANUARI (5 records):');
            const janSamples = await prisma.stockBalance.findMany({
                where: { period: new Date('2026-01-01') },
                take: 5,
                include: {
                    product: { select: { name: true, code: true } },
                    warehouse: { select: { name: true } }
                }
            });

            janSamples.forEach((sb, i) => {
                console.log(`   ${i + 1}. ${sb.product.code} - ${sb.product.name}`);
                console.log(`      Warehouse: ${sb.warehouse.name}`);
                console.log(`      Stock: Awal=${sb.stockAwal}, In=${sb.stockIn}, Out=${sb.stockOut}, Akhir=${sb.stockAkhir}`);
                console.log(`      OnPR=${sb.onPR}, Booked=${sb.bookedStock}, Available=${sb.availableStock}`);
                console.log(`      Value: Rp ${Number(sb.inventoryValue).toLocaleString('id-ID')}`);
            });
        }

        // 4. Lihat sample data Februari
        if (febCount > 0) {
            console.log('\n📦 SAMPLE DATA FEBRUARI (5 records):');
            const febSamples = await prisma.stockBalance.findMany({
                where: { period: new Date('2026-02-01') },
                take: 5,
                include: {
                    product: { select: { name: true, code: true } },
                    warehouse: { select: { name: true } }
                }
            });

            febSamples.forEach((sb, i) => {
                console.log(`   ${i + 1}. ${sb.product.code} - ${sb.product.name}`);
                console.log(`      Warehouse: ${sb.warehouse.name}`);
                console.log(`      Stock: Awal=${sb.stockAwal}, In=${sb.stockIn}, Out=${sb.stockOut}, Akhir=${sb.stockAkhir}`);
                console.log(`      OnPR=${sb.onPR}, Booked=${sb.bookedStock}, Available=${sb.availableStock}`);
                console.log(`      Value: Rp ${Number(sb.inventoryValue).toLocaleString('id-ID')}`);
            });
        }

        // 5. Opsi hapus data Februari
        console.log('\n' + '='.repeat(60));
        console.log('⚠️  CLEANUP OPTIONS');
        console.log('='.repeat(60));
        
        if (febCount > 0) {
            console.log(`\n❌ Untuk menghapus ${febCount} records Februari, jalankan:`);
            console.log('   node scripts/cleanFebStockData.js');
        } else {
            console.log('\n✅ Tidak ada data Februari yang perlu dihapus.');
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndCleanStockData();
