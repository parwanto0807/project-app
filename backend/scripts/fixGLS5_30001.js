/**
 * fixGLS5_30001.js
 * Fix: GLS akun 5-30001 tersimpan di tanggal 28 Feb (UTC) dengan credit dobel.
 * Solusi: hapus record 28 Feb, buat record baru 1 Mar (UTC) dengan credit benar dari LedgerLine.
 */
import { prisma } from '../src/config/db.js';

async function main() {
  const coa = await prisma.chartOfAccounts.findUnique({ where: { code: '5-30001' } });
  const period = await prisma.accountingPeriod.findFirst({ where: { fiscalYear: 2026, periodMonth: 3 } });

  console.log(`Fixing GLS for ${coa.code} - ${coa.name} | Period: ${period.periodName}\n`);

  // 1. Hapus semua GLS records untuk 5-30001 di period Maret (termasuk yg salah tanggal)
  const deleted = await prisma.generalLedgerSummary.deleteMany({
    where: { coaId: coa.id, periodId: period.id }
  });
  console.log(`Deleted ${deleted.count} old GLS records for 5-30001 MAR-2026`);

  // 2. Hitung actual dari LedgerLine per tanggal
  const ledgers = await prisma.ledger.findMany({
    where: { periodId: period.id },
    include: { ledgerLines: { where: { coaId: coa.id } } }
  });

  const byDate = {};
  for (const ledger of ledgers) {
    const lines = ledger.ledgerLines;
    if (lines.length === 0) continue;
    
    // Gunakan Jakarta timezone untuk menentukan tanggal
    const jakartaOffset = 7 * 60 * 60 * 1000;
    const jakartaDate = new Date(ledger.transactionDate.getTime() + jakartaOffset);
    const y = jakartaDate.getUTCFullYear();
    const m = jakartaDate.getUTCMonth();
    const d = jakartaDate.getUTCDate();
    const dateKey = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const utcDate = new Date(Date.UTC(y, m, d));
    
    if (!byDate[dateKey]) byDate[dateKey] = { utcDate, debit: 0, credit: 0, count: 0 };
    for (const l of lines) {
      byDate[dateKey].debit += Number(l.debitAmount);
      byDate[dateKey].credit += Number(l.creditAmount);
      byDate[dateKey].count++;
    }
  }

  // 3. Buat GLS records baru sesuai actual
  for (const [dateKey, vals] of Object.entries(byDate)) {
    const closingBalance = vals.debit - vals.credit; // openingBalance = 0
    const newGLS = await prisma.generalLedgerSummary.create({
      data: {
        coaId: coa.id,
        periodId: period.id,
        date: vals.utcDate,
        openingBalance: 0,
        debitTotal: vals.debit,
        creditTotal: vals.credit,
        closingBalance: closingBalance,
        transactionCount: vals.count
      }
    });
    console.log(`Created GLS: ${dateKey} | D=${vals.debit.toLocaleString('id-ID')} | K=${vals.credit.toLocaleString('id-ID')} | CL=${closingBalance.toLocaleString('id-ID')}`);
  }

  // 4. Verifikasi final
  console.log('\n=== FINAL VERIFICATION ===');
  const allGLS = await prisma.generalLedgerSummary.findMany({
    where: { periodId: period.id },
    include: { coa: { select: { code: true } } }
  });
  let totD=0, totC=0;
  for (const g of allGLS) {
    totD += Number(g.debitTotal);
    totC += Number(g.creditTotal);
  }
  console.log(`Grand Total GLS MAR-2026: D=${totD.toLocaleString('id-ID')} K=${totC.toLocaleString('id-ID')}`);
  console.log(Math.abs(totD-totC) < 0.01 ? '✅ BALANCED!' : `❌ MASIH IMBALANCE: ${(totD-totC).toLocaleString('id-ID')}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
