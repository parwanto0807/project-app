import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkAllStockPeriods() {
    try {
        console.log('='.repeat(60));
        console.log('CHECKING ALL STOCK BALANCE PERIODS');
        console.log('='.repeat(60));

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

        console.log('\n📅 PERIODE YANG ADA DI STOCKBALANCE:');
        if (allPeriods.length === 0) {
            console.log('   ❌ TIDAK ADA DATA STOCKBALANCE SAMA SEKALI!');
            console.log('\n💡 KEMUNGKINAN PENYEBAB:');
            console.log('   1. Belum ada transaksi GR/Stock yang membuat StockBalance');
            console.log('   2. Database baru di-restore dan belum ada data stock');
            console.log('   3. StockBalance belum di-generate dari transaksi existing');
        } else {
            allPeriods.forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.period_name} (${p.period_date})`);
                console.log(`      Records: ${p.record_count}, Total Stock: ${p.total_stock}`);
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

        console.log('\n📋 ACCOUNTING PERIODS:');
        periods.forEach((p, i) => {
            const status = p.isClosed ? '🔒 CLOSED' : '🔓 OPEN';
            console.log(`   ${i + 1}. ${p.periodCode} - ${p.periodName} ${status}`);
            console.log(`      Start: ${p.startDate.toISOString().split('T')[0]}`);
        });

        // 3. Cek apakah ada GoodsReceipt
        const grCount = await prisma.goodsReceipt.count();
        console.log(`\n📦 GOODS RECEIPTS: ${grCount} records`);

        if (grCount > 0) {
            const sampleGR = await prisma.goodsReceipt.findFirst({
                select: {
                    grNumber: true,
                    grDate: true,
                    status: true
                }
            });
            console.log(`   Sample: ${sampleGR.grNumber} (${sampleGR.grDate.toISOString().split('T')[0]}) - ${sampleGR.status}`);
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllStockPeriods();
