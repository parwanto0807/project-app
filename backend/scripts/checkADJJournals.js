/**
 * checkADJJournals.js - Audit jurnal JV-ADJ-STK & semua ledger untuk cek imbalance
 */
import { prisma } from '../src/config/db.js';

async function main() {
  console.log('=== AUDIT JV-ADJ-STK JOURNALS ===\n');

  const ledgers = await prisma.ledger.findMany({
    where: { ledgerNumber: { startsWith: 'JV-ADJ-STK' } },
    include: {
      ledgerLines: {
        include: {
          coa: { select: { code: true, name: true, type: true } }
        },
        orderBy: { lineNumber: 'asc' }
      }
    },
    orderBy: { ledgerNumber: 'asc' }
  });

  console.log(`Ditemukan ${ledgers.length} jurnal JV-ADJ-STK\n`);

  let grandDebit = 0;
  let grandCredit = 0;

  for (const ledger of ledgers) {
    const totalD = ledger.ledgerLines.reduce((s, l) => s + Number(l.debitAmount), 0);
    const totalC = ledger.ledgerLines.reduce((s, l) => s + Number(l.creditAmount), 0);
    const balanced = Math.abs(totalD - totalC) < 0.01;

    console.log(`📋 ${ledger.ledgerNumber} | ${balanced ? '✅ BALANCED' : '❌ IMBALANCED'}`);
    console.log(`   Total D: ${totalD.toLocaleString('id-ID')} | Total K: ${totalC.toLocaleString('id-ID')}`);
    for (const line of ledger.ledgerLines) {
      const d = Number(line.debitAmount);
      const c = Number(line.creditAmount);
      console.log(`   Line ${line.lineNumber}: [${line.coa.code}] ${line.coa.name} | D:${d.toLocaleString('id-ID')} K:${c.toLocaleString('id-ID')}`);
    }
    grandDebit += totalD;
    grandCredit += totalC;
    console.log();
  }

  console.log(`=== GRAND TOTAL ===`);
  console.log(`Total Debit  : ${grandDebit.toLocaleString('id-ID')}`);
  console.log(`Total Credit : ${grandCredit.toLocaleString('id-ID')}`);
  console.log(`Selisih      : ${(grandDebit - grandCredit).toLocaleString('id-ID')}`);
  console.log(Math.abs(grandDebit - grandCredit) < 0.01 ? '✅ BALANCED' : '❌ IMBALANCED');

  // Cek juga semua ledger non-ADJ supaya tahu konteks global
  console.log('\n\n=== 20 LEDGER TERAKHIR ===');
  const allLedgers = await prisma.ledger.findMany({
    orderBy: { ledgerNumber: 'desc' },
    take: 20,
    include: {
      ledgerLines: { select: { debitAmount: true, creditAmount: true } }
    }
  });

  for (const l of allLedgers) {
    const d = l.ledgerLines.reduce((s, x) => s + Number(x.debitAmount), 0);
    const c = l.ledgerLines.reduce((s, x) => s + Number(x.creditAmount), 0);
    const ok = Math.abs(d - c) < 0.01;
    console.log(`${ok ? '✅' : '❌'} ${l.ledgerNumber} | D:${d.toLocaleString('id-ID')} K:${c.toLocaleString('id-ID')}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
