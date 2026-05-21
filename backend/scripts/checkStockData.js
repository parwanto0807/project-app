import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkAndCleanStockData() {
    try {
        (() => {})('='.repeat(60));
        (() => {})('STOCK BALANCE DATA CHECK');
        (() => {})('='.repeat(60));

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

        (() => {})('\n📅 JANUARI 2026:');
        (() => {})(`   Total Records: ${janCount}`);
        (() => {})(`   Total Stock Akhir: ${janData._sum.stockAkhir || 0}`);
        (() => {})(`   Total Inventory Value: Rp ${(janData._sum.inventoryValue || 0).toLocaleString('id-ID')}`);

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

        (() => {})('\n📅 FEBRUARI 2026:');
        (() => {})(`   Total Records: ${febCount}`);
        (() => {})(`   Total Stock Akhir: ${febData._sum.stockAkhir || 0}`);
        (() => {})(`   Total Inventory Value: Rp ${(febData._sum.inventoryValue || 0).toLocaleString('id-ID')}`);

        // 3. Lihat sample data Januari
        if (janCount > 0) {
            (() => {})('\n📦 SAMPLE DATA JANUARI (5 records):');
            const janSamples = await prisma.stockBalance.findMany({
                where: { period: new Date('2026-01-01') },
                take: 5,
                include: {
                    product: { select: { name: true, code: true } },
                    warehouse: { select: { name: true } }
                }
            });

            janSamples.forEach((sb, i) => {
                (() => {})(`   ${i + 1}. ${sb.product.code} - ${sb.product.name}`);
                (() => {})(`      Warehouse: ${sb.warehouse.name}`);
                (() => {})(`      Stock: Awal=${sb.stockAwal}, In=${sb.stockIn}, Out=${sb.stockOut}, Akhir=${sb.stockAkhir}`);
                (() => {})(`      OnPR=${sb.onPR}, Booked=${sb.bookedStock}, Available=${sb.availableStock}`);
                (() => {})(`      Value: Rp ${Number(sb.inventoryValue).toLocaleString('id-ID')}`);
            });
        }

        // 4. Lihat sample data Februari
        if (febCount > 0) {
            (() => {})('\n📦 SAMPLE DATA FEBRUARI (5 records):');
            const febSamples = await prisma.stockBalance.findMany({
                where: { period: new Date('2026-02-01') },
                take: 5,
                include: {
                    product: { select: { name: true, code: true } },
                    warehouse: { select: { name: true } }
                }
            });

            febSamples.forEach((sb, i) => {
                (() => {})(`   ${i + 1}. ${sb.product.code} - ${sb.product.name}`);
                (() => {})(`      Warehouse: ${sb.warehouse.name}`);
                (() => {})(`      Stock: Awal=${sb.stockAwal}, In=${sb.stockIn}, Out=${sb.stockOut}, Akhir=${sb.stockAkhir}`);
                (() => {})(`      OnPR=${sb.onPR}, Booked=${sb.bookedStock}, Available=${sb.availableStock}`);
                (() => {})(`      Value: Rp ${Number(sb.inventoryValue).toLocaleString('id-ID')}`);
            });
        }

        // 5. Opsi hapus data Februari
        (() => {})('\n' + '='.repeat(60));
        (() => {})('⚠️  CLEANUP OPTIONS');
        (() => {})('='.repeat(60));
        
        if (febCount > 0) {
            (() => {})(`\n❌ Untuk menghapus ${febCount} records Februari, jalankan:`);
            (() => {})('   node scripts/cleanFebStockData.js');
        } else {
            (() => {})('\n✅ Tidak ada data Februari yang perlu dihapus.');
        }

        (() => {})('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndCleanStockData();
