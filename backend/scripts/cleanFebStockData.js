import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function cleanFebStockData() {
    try {
        console.log('⚠️  MENGHAPUS DATA STOCK FEBRUARI 2026...\n');

        // Cek jumlah data sebelum dihapus
        const count = await prisma.stockBalance.count({
            where: { period: new Date('2026-02-01') }
        });

        if (count === 0) {
            console.log('✅ Tidak ada data Februari yang perlu dihapus.');
            return;
        }

        console.log(`📊 Ditemukan ${count} records Februari yang akan dihapus.`);
        console.log('⏳ Menghapus...\n');

        // Hapus data Februari
        const result = await prisma.stockBalance.deleteMany({
            where: { period: new Date('2026-02-01') }
        });

        console.log(`✅ Berhasil menghapus ${result.count} records Februari!`);
        console.log('\n🎯 Sekarang Anda bisa closing Januari lagi untuk rollover data yang benar.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

cleanFebStockData();
