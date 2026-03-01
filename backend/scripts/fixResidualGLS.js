/**
 * fixResidualGLS.js
 * Memperbaiki sisa GeneralLedgerSummary yang masih menggunakan COA 6-10501
 * ketika LedgerLine sudah dipindahkan ke 5-30001.
 */
import { prisma } from '../src/config/db.js';

async function main() {
  console.log('Fixing residual GeneralLedgerSummary records...');

  const wrongCOA = await prisma.chartOfAccounts.findUnique({ where: { code: '6-10501' } });
  const correctCOA = await prisma.chartOfAccounts.findUnique({ where: { code: '5-30001' } });

  // Ambil semua GL Summary dengan saldo non-zero di akun salah
  const residualGLS = await prisma.generalLedgerSummary.findMany({
    where: {
      coaId: wrongCOA.id,
      OR: [
        { debitTotal: { gt: 0 } },
        { creditTotal: { gt: 0 } }
      ]
    },
    include: { period: { select: { periodName: true } } }
  });

  if (residualGLS.length === 0) {
    console.log('✅ Tidak ada residual GeneralLedgerSummary untuk 6-10501. Semua sudah bersih!');
    return;
  }

  console.log(`⚠️  Ditemukan ${residualGLS.length} residual GLSummary, memperbaiki...\n`);

  await prisma.$transaction(async (tx) => {
    for (const gls of residualGLS) {
      const debit = Number(gls.debitTotal);
      const credit = Number(gls.creditTotal);
      const netChange = debit - credit;
      
      console.log(`  🔧 ${gls.period?.periodName} / ${gls.date.toISOString().split('T')[0]}: D=${debit.toLocaleString('id-ID')}, K=${credit.toLocaleString('id-ID')}`);

      // 1. Nolkan record di akun salah
      await tx.generalLedgerSummary.update({
        where: { id: gls.id },
        data: {
          debitTotal: 0,
          creditTotal: 0,
          closingBalance: Number(gls.openingBalance), // kembali ke opening saja
          transactionCount: 0
        }
      });
      console.log(`     ✅ GLSummary 6-10501 di-nolkan`);

      // 2. Tambahkan ke akun benar
      const summaryDate = new Date(gls.date);
      summaryDate.setHours(0, 0, 0, 0);

      const correctGLS = await tx.generalLedgerSummary.findUnique({
        where: {
          coaId_periodId_date: {
            coaId: correctCOA.id,
            periodId: gls.periodId,
            date: summaryDate
          }
        }
      });

      if (correctGLS) {
        await tx.generalLedgerSummary.update({
          where: {
            coaId_periodId_date: {
              coaId: correctCOA.id,
              periodId: gls.periodId,
              date: summaryDate
            }
          },
          data: {
            debitTotal:   { increment: debit },
            creditTotal:  { increment: credit },
            closingBalance: { increment: netChange },
            transactionCount: { increment: residualGLS.length > 0 ? 1 : 0 }
          }
        });
        console.log(`     ✅ GLSummary 5-30001 ditambahkan`);
      } else {
        // Cari opening balance dari hari sebelumnya
        const prevDay = new Date(summaryDate);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevGLS = await tx.generalLedgerSummary.findFirst({
          where: { coaId: correctCOA.id, periodId: gls.periodId, date: { lte: prevDay } },
          orderBy: { date: 'desc' }
        });
        const openingBalance = prevGLS ? Number(prevGLS.closingBalance) : 0;

        await tx.generalLedgerSummary.create({
          data: {
            coaId: correctCOA.id,
            periodId: gls.periodId,
            date: summaryDate,
            openingBalance,
            debitTotal: debit,
            creditTotal: credit,
            closingBalance: openingBalance + netChange,
            transactionCount: 1,
            currency: 'IDR'
          }
        });
        console.log(`     ✅ GLSummary 5-30001 dibuat baru`);
      }
    }
  });

  console.log('\n✅ Semua residual GLSummary berhasil diperbaiki!');
}

main()
  .catch((e) => { console.error('❌ ERROR:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
