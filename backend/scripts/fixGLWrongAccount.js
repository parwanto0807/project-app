/**
 * fixGLWrongAccount.js
 * 
 * Script untuk mengaudit dan memperbaiki data General Ledger, 
 * TrialBalance, dan GeneralLedgerSummary yang mungkin menggunakan
 * akun yang salah (6-10501 Beban Penyusutan Kendaraan) 
 * padahal seharusnya menggunakan (5-30001 Selisih Penyesuaian Stok).
 * 
 * CARA KERJA:
 * 1. AUDIT: Cek LedgerLine mana saja yang menggunakan coaId 6-10501 
 *    dalam konteks jurnal inventory adjustment (JV-ADJ-STK-*)
 * 2. FIX LedgerLine: Pindahkan coaId dari 6-10501 ke 5-30001
 * 3. FIX TrialBalance: Kurangi saldo di 6-10501, tambahkan ke 5-30001
 * 4. FIX GeneralLedgerSummary: Kurangi di 6-10501, tambahkan ke 5-30001
 * 
 * JALANKAN DENGAN: node scripts/fixGLWrongAccount.js
 * Tambahkan --dry-run untuk preview saja tanpa mengubah data.
 */

import { prisma } from '../src/config/db.js';

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('='.repeat(60));
  console.log('🔍 GL WRONG ACCOUNT AUDIT & FIX SCRIPT');
  console.log(`📋 Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE (will modify data)'}`);
  console.log('='.repeat(60));

  // ════════════════════════════════════════════════════════
  // STEP 1: Temukan kedua COA
  // ════════════════════════════════════════════════════════
  const wrongCOA = await prisma.chartOfAccounts.findUnique({ where: { code: '6-10501' } });
  const correctCOA = await prisma.chartOfAccounts.findUnique({ where: { code: '5-30001' } });

  if (!wrongCOA) {
    console.log('✅ COA 6-10501 tidak ditemukan di database. Tidak ada yang perlu diperbaiki.');
    return;
  }
  if (!correctCOA) {
    console.error('❌ COA 5-30001 (BENAR) tidak ditemukan! Jalankan seedInventoryAdjustmentCOA.js terlebih dahulu.');
    process.exit(1);
  }

  console.log(`\n📊 COA Salah   : ${wrongCOA.code} - ${wrongCOA.name} (ID: ${wrongCOA.id})`);
  console.log(`📊 COA Benar   : ${correctCOA.code} - ${correctCOA.name} (ID: ${correctCOA.id})\n`);

  // ════════════════════════════════════════════════════════
  // STEP 2: Audit LedgerLine yang menggunakan COA salah
  //         dalam konteks jurnal inventory adjustment
  // ════════════════════════════════════════════════════════
  console.log('─'.repeat(60));
  console.log('STEP 2: Audit LedgerLine dengan akun salah...');

  const wrongLines = await prisma.ledgerLine.findMany({
    where: {
      coaId: wrongCOA.id,
      ledger: {
        ledgerNumber: { startsWith: 'JV-ADJ-STK' }
      }
    },
    include: {
      ledger: {
        select: {
          id: true,
          ledgerNumber: true,
          description: true,
          periodId: true,
          transactionDate: true,
          period: { select: { periodName: true } }
        }
      }
    }
  });

  if (wrongLines.length === 0) {
    console.log('✅ Tidak ada LedgerLine inventory adjustment yang menggunakan akun 6-10501.');
    console.log('   Data General Ledger dan Trial Balance sudah bersih!');
    
    // Tetap cek TrialBalance kalau ada saldo yang salah masuk
    await auditTrialBalance(wrongCOA, correctCOA);
    return;
  }

  console.log(`⚠️  Ditemukan ${wrongLines.length} LedgerLine menggunakan akun SALAH:\n`);
  
  // Ringkas per periode
  const byPeriod = {};
  let totalWrongDebit = 0;
  let totalWrongCredit = 0;

  for (const line of wrongLines) {
    const periodName = line.ledger.period?.periodName || line.ledger.periodId;
    if (!byPeriod[line.ledger.periodId]) {
      byPeriod[line.ledger.periodId] = { 
        name: periodName, 
        lines: [], 
        totalDebit: 0, 
        totalCredit: 0 
      };
    }
    byPeriod[line.ledger.periodId].lines.push(line);
    byPeriod[line.ledger.periodId].totalDebit += Number(line.debitAmount);
    byPeriod[line.ledger.periodId].totalCredit += Number(line.creditAmount);
    totalWrongDebit += Number(line.debitAmount);
    totalWrongCredit += Number(line.creditAmount);
  }

  for (const [periodId, data] of Object.entries(byPeriod)) {
    console.log(`  📅 Periode: ${data.name}`);
    for (const line of data.lines) {
      console.log(`     - Ledger: ${line.ledger.ledgerNumber}`);
      console.log(`       Debit: ${Number(line.debitAmount).toLocaleString('id-ID')} | Credit: ${Number(line.creditAmount).toLocaleString('id-ID')}`);
    }
    console.log(`     Sub-total D: ${data.totalDebit.toLocaleString('id-ID')} | K: ${data.totalCredit.toLocaleString('id-ID')}\n`);
  }

  console.log(`📊 TOTAL SALAH → Debit: ${totalWrongDebit.toLocaleString('id-ID')} | Credit: ${totalWrongCredit.toLocaleString('id-ID')}`);

  if (isDryRun) {
    console.log('\n[DRY RUN] Tidak ada perubahan yang dilakukan.');
    await auditTrialBalance(wrongCOA, correctCOA);
    return;
  }

  // ════════════════════════════════════════════════════════
  // STEP 3: FIX - Pindahkan coaId di LedgerLine
  // ════════════════════════════════════════════════════════
  console.log('\n─'.repeat(60));
  console.log('STEP 3: Memperbaiki LedgerLine...');

  await prisma.$transaction(async (tx) => {
    // 3a. Update semua LedgerLine: ganti coaId dari salah ke benar
    const updateResult = await tx.ledgerLine.updateMany({
      where: {
        coaId: wrongCOA.id,
        ledger: {
          ledgerNumber: { startsWith: 'JV-ADJ-STK' }
        }
      },
      data: { coaId: correctCOA.id }
    });
    console.log(`✅ ${updateResult.count} LedgerLine berhasil dipindahkan ke COA 5-30001`);

    // ════════════════════════════════════════════════════════
    // STEP 4: FIX TrialBalance per periode
    // ════════════════════════════════════════════════════════
    console.log('\nSTEP 4: Memperbaiki TrialBalance...');

    for (const [periodId, data] of Object.entries(byPeriod)) {
      const debitToMove = data.totalDebit;
      const creditToMove = data.totalCredit;

      console.log(`  📅 Periode: ${data.name}`);

      // 4a. Kurangi saldo di akun salah (6-10501)
      const wrongTB = await tx.trialBalance.findUnique({
        where: { periodId_coaId: { periodId, coaId: wrongCOA.id } }
      });

      if (wrongTB) {
        await tx.trialBalance.update({
          where: { periodId_coaId: { periodId, coaId: wrongCOA.id } },
          data: {
            periodDebit:  { decrement: debitToMove },
            periodCredit: { decrement: creditToMove },
            endingDebit:  { decrement: debitToMove },
            endingCredit: { decrement: creditToMove },
            ytdDebit:     { decrement: debitToMove },
            ytdCredit:    { decrement: creditToMove },
            calculatedAt: new Date()
          }
        });
        console.log(`  ✅ TrialBalance 6-10501 dikurangi: D-${debitToMove.toLocaleString('id-ID')} K-${creditToMove.toLocaleString('id-ID')}`);
      } else {
        console.log(`  ⚠️  TrialBalance 6-10501 tidak ditemukan untuk periode ${data.name}`);
      }

      // 4b. Tambahkan ke akun benar (5-30001)
      const correctTB = await tx.trialBalance.findUnique({
        where: { periodId_coaId: { periodId, coaId: correctCOA.id } }
      });

      if (correctTB) {
        await tx.trialBalance.update({
          where: { periodId_coaId: { periodId, coaId: correctCOA.id } },
          data: {
            periodDebit:  { increment: debitToMove },
            periodCredit: { increment: creditToMove },
            endingDebit:  { increment: debitToMove },
            endingCredit: { increment: creditToMove },
            ytdDebit:     { increment: debitToMove },
            ytdCredit:    { increment: creditToMove },
            calculatedAt: new Date()
          }
        });
        console.log(`  ✅ TrialBalance 5-30001 ditambahkan: D+${debitToMove.toLocaleString('id-ID')} K+${creditToMove.toLocaleString('id-ID')}`);
      } else {
        // Buat record baru untuk 5-30001
        await tx.trialBalance.create({
          data: {
            periodId,
            coaId: correctCOA.id,
            openingDebit: 0,
            openingCredit: 0,
            periodDebit: debitToMove,
            periodCredit: creditToMove,
            endingDebit: debitToMove,
            endingCredit: creditToMove,
            ytdDebit: debitToMove,
            ytdCredit: creditToMove,
            currency: 'IDR',
            calculatedAt: new Date()
          }
        });
        console.log(`  ✅ TrialBalance 5-30001 dibuat baru: D+${debitToMove.toLocaleString('id-ID')} K+${creditToMove.toLocaleString('id-ID')}`);
      }
    }

    // ════════════════════════════════════════════════════════
    // STEP 5: FIX GeneralLedgerSummary
    // ════════════════════════════════════════════════════════
    console.log('\nSTEP 5: Memperbaiki GeneralLedgerSummary...');

    // Cari semua GL Summary dengan akun salah yang terhubung ke adjustment journals
    for (const line of wrongLines) {
      const summaryDate = new Date(line.ledger.transactionDate);
      summaryDate.setHours(0, 0, 0, 0);
      const periodId = line.ledger.periodId;

      const debit = Number(line.debitAmount);
      const credit = Number(line.creditAmount);
      const netChange = debit - credit;

      // 5a. Kurangi di akun salah
      const wrongGLS = await tx.generalLedgerSummary.findUnique({
        where: {
          coaId_periodId_date: {
            coaId: wrongCOA.id,
            periodId,
            date: summaryDate
          }
        }
      });

      if (wrongGLS) {
        const newDebit = Number(wrongGLS.debitTotal) - debit;
        const newCredit = Number(wrongGLS.creditTotal) - credit;
        const newClosing = Number(wrongGLS.closingBalance) - netChange;

        await tx.generalLedgerSummary.update({
          where: {
            coaId_periodId_date: {
              coaId: wrongCOA.id,
              periodId,
              date: summaryDate
            }
          },
          data: {
            debitTotal: newDebit,
            creditTotal: newCredit,
            closingBalance: newClosing,
            transactionCount: { decrement: 1 }
          }
        });
        console.log(`  ✅ GLSummary 6-10501 tanggal ${summaryDate.toISOString().split('T')[0]} dikurangi`);
      }

      // 5b. Tambahkan ke akun benar
      const correctGLS = await tx.generalLedgerSummary.findUnique({
        where: {
          coaId_periodId_date: {
            coaId: correctCOA.id,
            periodId,
            date: summaryDate
          }
        }
      });

      if (correctGLS) {
        await tx.generalLedgerSummary.update({
          where: {
            coaId_periodId_date: {
              coaId: correctCOA.id,
              periodId,
              date: summaryDate
            }
          },
          data: {
            debitTotal:    { increment: debit },
            creditTotal:   { increment: credit },
            closingBalance: { increment: netChange },
            transactionCount: { increment: 1 }
          }
        });
        console.log(`  ✅ GLSummary 5-30001 tanggal ${summaryDate.toISOString().split('T')[0]} ditambahkan`);
      } else {
        // Cari opening balance dari hari sebelumnya
        const prevDay = new Date(summaryDate);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevGLS = await tx.generalLedgerSummary.findFirst({
          where: { coaId: correctCOA.id, periodId, date: { lte: prevDay } },
          orderBy: { date: 'desc' }
        });
        const openingBalance = prevGLS ? Number(prevGLS.closingBalance) : 0;

        await tx.generalLedgerSummary.create({
          data: {
            coaId: correctCOA.id,
            periodId,
            date: summaryDate,
            openingBalance,
            debitTotal: debit,
            creditTotal: credit,
            closingBalance: openingBalance + netChange,
            transactionCount: 1,
            currency: 'IDR'
          }
        });
        console.log(`  ✅ GLSummary 5-30001 dibuat baru untuk tanggal ${summaryDate.toISOString().split('T')[0]}`);
      }
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ SELESAI! Semua data berhasil diperbaiki:');
  console.log(`   - LedgerLine: ${wrongLines.length} baris dipindahkan ke 5-30001`);
  console.log('   - TrialBalance: saldo dikoreksi per periode');
  console.log('   - GeneralLedgerSummary: saldo dikoreksi per tanggal');
  console.log('='.repeat(60));
}

async function auditTrialBalance(wrongCOA, correctCOA) {
  console.log('\n─'.repeat(60));
  console.log('AUDIT TrialBalance & GeneralLedgerSummary...');

  const wrongTBs = await prisma.trialBalance.findMany({
    where: {
      coaId: wrongCOA.id,
      OR: [
        { periodDebit: { gt: 0 } },
        { periodCredit: { gt: 0 } }
      ]
    },
    include: { period: { select: { periodName: true } } }
  });

  const wrongGLS = await prisma.generalLedgerSummary.findMany({
    where: {
      coaId: wrongCOA.id,
      OR: [
        { debitTotal: { gt: 0 } },
        { creditTotal: { gt: 0 } }
      ]
    },
    include: { period: { select: { periodName: true } } }
  });

  if (wrongTBs.length === 0 && wrongGLS.length === 0) {
    console.log('✅ TrialBalance dan GeneralLedgerSummary untuk 6-10501 bersih (saldo 0).');
  } else {
    if (wrongTBs.length > 0) {
      console.log(`\n⚠️  TrialBalance 6-10501 dengan saldo non-zero (${wrongTBs.length} periode):`);
      for (const tb of wrongTBs) {
        console.log(`   - ${tb.period?.periodName}: periodD=${Number(tb.periodDebit).toLocaleString('id-ID')}, periodK=${Number(tb.periodCredit).toLocaleString('id-ID')}`);
      }
    }
    if (wrongGLS.length > 0) {
      console.log(`\n⚠️  GeneralLedgerSummary 6-10501 dengan saldo non-zero (${wrongGLS.length} record):`);
      for (const gls of wrongGLS) {
        console.log(`   - ${gls.period?.periodName} / ${gls.date.toISOString().split('T')[0]}: D=${Number(gls.debitTotal).toLocaleString('id-ID')}, K=${Number(gls.creditTotal).toLocaleString('id-ID')}`);
      }
    }
    console.log('\n💡 Jalankan script ini TANPA --dry-run untuk memperbaiki data di atas.');
  }
}

main()
  .catch((e) => {
    console.error('❌ ERROR:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
