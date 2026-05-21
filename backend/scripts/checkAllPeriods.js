import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkAllStockPeriods() {
    try {
        (() => {})('='.repeat(60));
        (() => {})('CHECKING ALL STOCK BALANCE PERIODS');
        (() => {})('='.repeat(60));

        // 1. Cek semua periode yang ada di StockBalance
        const allPeriods = await prisma.$queryRaw`
            SELECT 
                TO_CHAR(period, 'YYYY-MM-DD') as period_date,
                TO_CHAR(period, 'Mon YYYY') as period_name,
                COUNT(*) as record_count,
                SUM("stockAkhir") as total_stock
            FROM "StockBalance"
            GROUP BY period
            ORDER BY period DESC
            LIMIT 10
        `;

        (() => {})('\n📅 PERIODE YANG ADA DI STOCKBALANCE:');
        if (allPeriods.length === 0) {
            (() => {})('   ❌ TIDAK ADA DATA STOCKBALANCE SAMA SEKALI!');
            (() => {})('\n💡 KEMUNGKINAN PENYEBAB:');
            (() => {})('   1. Belum ada transaksi GR/Stock yang membuat StockBalance');
            (() => {})('   2. Database baru di-restore dan belum ada data stock');
            (() => {})('   3. StockBalance belum di-generate dari transaksi existing');
        } else {
            allPeriods.forEach((p, i) => {
                (() => {})(`   ${i + 1}. ${p.period_name} (${p.period_date})`);
                (() => {})(`      Records: ${p.record_count}, Total Stock: ${p.total_stock}`);
            });
        }

        // 2. Cek AccountingPeriod yang ada
        const periods = await prisma.accountingPeriod.findMany({
            orderBy: { startDate: 'desc' },
            take: 5,
            select: {
                periodCode: true,
                periodName: true,
                startDate: true,
                isClosed: true
            }
        });

        (() => {})('\n📋 ACCOUNTING PERIODS:');
        periods.forEach((p, i) => {
            const status = p.isClosed ? '🔒 CLOSED' : '🔓 OPEN';
            (() => {})(`   ${i + 1}. ${p.periodCode} - ${p.periodName} ${status}`);
            (() => {})(`      Start: ${p.startDate.toISOString().split('T')[0]}`);
        });

        // 3. Cek apakah ada GoodsReceipt
        const grCount = await prisma.goodsReceipt.count();
        (() => {})(`\n📦 GOODS RECEIPTS: ${grCount} records`);

        if (grCount > 0) {
            const sampleGR = await prisma.goodsReceipt.findFirst({
                select: {
                    grNumber: true,
                    grDate: true,
                    status: true
                }
            });
            (() => {})(`   Sample: ${sampleGR.grNumber} (${sampleGR.grDate.toISOString().split('T')[0]}) - ${sampleGR.status}`);
        }

        (() => {})('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllStockPeriods();
