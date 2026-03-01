/**
 * checkTrialBalance.js - Audit TrialBalance Maret 2026 vs LedgerLine actuals
 */
import { prisma } from '../src/config/db.js';

async function main() {
  // Cari period Maret 2026
  const period = await prisma.accountingPeriod.findFirst({
    where: { fiscalYear: 2026, periodMonth: 3 }
  });

  if (!period) {
    console.log('❌ Period Maret 2026 tidak ditemukan!');
    return;
  }

  console.log(`Period: ${period.periodName} (${period.id})\n`);

  // Hitung actual dari LedgerLine untuk period ini
  const ledgersInPeriod = await prisma.ledger.findMany({
    where: { periodId: period.id },
    include: { ledgerLines: { include: { coa: { select: { code: true, name: true } } } } }
  });

  // Aggregate per COA dari actual LedgerLines
  const actualByCOA = new Map();
  for (const ledger of ledgersInPeriod) {
    for (const line of ledger.ledgerLines) {
      const key = line.coaId;
      if (!actualByCOA.has(key)) {
        actualByCOA.set(key, { code: line.coa.code, name: line.coa.name, debit: 0, credit: 0 });
      }
      const entry = actualByCOA.get(key);
      entry.debit += Number(line.debitAmount);
      entry.credit += Number(line.creditAmount);
    }
  }

  // Bandingkan dengan TrialBalance
  const trialBalances = await prisma.trialBalance.findMany({
    where: { periodId: period.id },
    include: { coa: { select: { code: true, name: true } } }
  });

  console.log('=== TRIAL BALANCE vs ACTUAL LEDGERLINES ===\n');

  let hasDiff = false;
  for (const tb of trialBalances) {
    const actual = actualByCOA.get(tb.coaId);
    const tbD = Number(tb.periodDebit);
    const tbK = Number(tb.periodCredit);
    const actD = actual?.debit || 0;
    const actK = actual?.credit || 0;
    const diffD = tbD - actD;
    const diffK = tbK - actK;

    if (Math.abs(diffD) > 0.01 || Math.abs(diffK) > 0.01) {
      hasDiff = true;
      console.log(`❌ [${tb.coa.code}] ${tb.coa.name}`);
      console.log(`   TB  : D=${tbD.toLocaleString('id-ID')} K=${tbK.toLocaleString('id-ID')}`);
      console.log(`   ACTUAL: D=${actD.toLocaleString('id-ID')} K=${actK.toLocaleString('id-ID')}`);
      console.log(`   DIFF  : D=${diffD.toLocaleString('id-ID')} K=${diffK.toLocaleString('id-ID')}\n`);
    }
  }

  // Cek akun yang ada di actual tapi tidak di TrialBalance
  for (const [coaId, actual] of actualByCOA) {
    const found = trialBalances.find(tb => tb.coaId === coaId);
    if (!found) {
      hasDiff = true;
      console.log(`⚠️  [${actual.code}] ${actual.name} - Ada di Ledger tapi TIDAK di TrialBalance!`);
      console.log(`   ACTUAL: D=${actual.debit.toLocaleString('id-ID')} K=${actual.credit.toLocaleString('id-ID')}\n`);
    }
  }

  if (!hasDiff) {
    console.log('✅ Semua TrialBalance cocok dengan LedgerLine actuals!\n');
  }

  // Summary TrialBalance totals
  const totD = trialBalances.reduce((s, tb) => s + Number(tb.periodDebit), 0);
  const totK = trialBalances.reduce((s, tb) => s + Number(tb.periodCredit), 0);
  console.log(`\n=== TRIAL BALANCE GRAND TOTAL ===`);
  console.log(`Total Debit  : ${totD.toLocaleString('id-ID')}`);
  console.log(`Total Credit : ${totK.toLocaleString('id-ID')}`);
  console.log(`Selisih      : ${(totD - totK).toLocaleString('id-ID')}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
