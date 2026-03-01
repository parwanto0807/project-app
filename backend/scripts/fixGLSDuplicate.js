/**
 * fixGLSDuplicate.js
 * Memperbaiki duplikasi di GeneralLedgerSummary akun 5-30001 Maret 2026.
 * 
 * Masalah: creditTotal 5-30001 = 105.934.000 (harusnya 52.967.000)
 * Penyebab: fixGLWrongAccount.js dan fixResidualGLS.js menambahkan kredit dua kali.
 * 
 * Fix: Set creditTotal dan closingBalance ke nilai yang benar (dari LedgerLine actuals).
 */
import { prisma } from '../src/config/db.js';

async function main() {
  const coa5 = await prisma.chartOfAccounts.findUnique({ where: { code: '5-30001' } });
  const period = await prisma.accountingPeriod.findFirst({ where: { fiscalYear: 2026, periodMonth: 3 } });

  console.log(`COA: ${coa5.code} - ${coa5.name}`);
  console.log(`Period: ${period.periodName}\n`);

  // Hitung actual dari LedgerLine untuk akun ini di period ini
  const ledgers = await prisma.ledger.findMany({ where: { periodId: period.id } });
  const ledgerIds = ledgers.map(l => l.id);

  const lines = await prisma.ledgerLine.findMany({
    where: { ledgerId: { in: ledgerIds }, coaId: coa5.id }
  });

  const actualDebit = lines.reduce((s, l) => s + Number(l.debitAmount), 0);
  const actualCredit = lines.reduce((s, l) => s + Number(l.creditAmount), 0);

  console.log(`LedgerLine actuals untuk 5-30001:`);
  console.log(`  Debit : ${actualDebit.toLocaleString('id-ID')}`);
  console.log(`  Kredit: ${actualCredit.toLocaleString('id-ID')}\n`);

  // Ambil semua GLS records untuk akun ini di period ini
  const glsRecords = await prisma.generalLedgerSummary.findMany({
    where: { coaId: coa5.id, periodId: period.id }
  });

  console.log(`GeneralLedgerSummary records (current):`);
  for (const g of glsRecords) {
    console.log(`  Date: ${g.date.toISOString().split('T')[0]} | O=${Number(g.openingBalance).toLocaleString()} | D=${Number(g.debitTotal).toLocaleString()} | K=${Number(g.creditTotal).toLocaleString()} | CL=${Number(g.closingBalance).toLocaleString()}`);
  }

  // Hitung credit per tanggal dari LedgerLine
  const byDate = {};
  for (const ledger of ledgers) {
    const ledgerLines = await prisma.ledgerLine.findMany({
      where: { ledgerId: ledger.id, coaId: coa5.id }
    });
    if (ledgerLines.length === 0) continue;

    // Normalize date ke UTC midnight
    const jakartaDate = new Date(ledger.transactionDate.getTime() + (7 * 60 * 60 * 1000));
    const dateKey = `${jakartaDate.getUTCFullYear()}-${String(jakartaDate.getUTCMonth()+1).padStart(2,'0')}-${String(jakartaDate.getUTCDate()).padStart(2,'0')}`;
    
    if (!byDate[dateKey]) byDate[dateKey] = { debit: 0, credit: 0 };
    for (const l of ledgerLines) {
      byDate[dateKey].debit += Number(l.debitAmount);
      byDate[dateKey].credit += Number(l.creditAmount);
    }
  }

  console.log('\nActual per tanggal dari LedgerLine:');
  for (const [date, vals] of Object.entries(byDate)) {
    console.log(`  ${date}: D=${vals.debit.toLocaleString()} K=${vals.credit.toLocaleString()}`);
  }

  console.log('\nMemperbaiki GLS records...');
  // Update setiap GLS record ke nilai actual
  for (const g of glsRecords) {
    const dateKey = g.date.toISOString().split('T')[0];
    const actual = byDate[dateKey] || { debit: 0, credit: 0 };
    const openBal = Number(g.openingBalance);
    const newClosing = openBal + actual.debit - actual.credit;

    await prisma.generalLedgerSummary.update({
      where: { id: g.id },
      data: {
        debitTotal: actual.debit,
        creditTotal: actual.credit,
        closingBalance: newClosing,
        transactionCount: lines.length
      }
    });
    console.log(`  ✅ ${dateKey}: D=${actual.debit.toLocaleString()} K=${actual.credit.toLocaleString()} CL=${newClosing.toLocaleString()}`);
  }

  console.log('\n✅ GLS diperbaiki! Verifikasi ulang...\n');

  // Verifikasi
  const verif = await prisma.generalLedgerSummary.findMany({
    where: { periodId: period.id },
    include: { coa: { select: { code: true } } }
  });
  let totD=0, totC=0;
  for (const v of verif) {
    totD += Number(v.debitTotal);
    totC += Number(v.creditTotal);
  }
  console.log(`Grand Total GLS MAR-2026: D=${totD.toLocaleString('id-ID')} K=${totC.toLocaleString('id-ID')}`);
  console.log(Math.abs(totD-totC) < 0.01 ? '✅ BALANCED' : `❌ MASIH IMBALANCE: ${(totD-totC).toLocaleString('id-ID')}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
