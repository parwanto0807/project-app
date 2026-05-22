/**
 * Script: Void Ledger JV-202605-0024
 * Tujuan: Membatalkan transaksi trial yang sudah ter-posting ke Buku Besar
 * Jalankan: node src/scripts/void-ledger.js
 */

import { prisma } from '../config/db.js';
import { normalizeToJakartaStartOfDay } from '../utils/dateUtils.js';

const LEDGER_NUMBER = 'JV-202605-0024';
const VOID_REASON = 'Data trial - dibatalkan manual oleh admin';
const VOIDED_BY = 'ADMIN-SCRIPT';

async function voidLedger() {
  ;(() => {})(`\n🔍 Mencari Ledger: ${LEDGER_NUMBER} ...\n`);

  const target = await prisma.ledger.findUnique({
    where: { ledgerNumber: LEDGER_NUMBER },
    include: {
      ledgerLines: { include: { coa: true } },
      period: true,
    },
  });

  if (!target) {
    console.error(`❌ Ledger '${LEDGER_NUMBER}' tidak ditemukan!`);
    process.exit(1);
  }

  ;(() => {})(`✅ Ditemukan: ${target.ledgerNumber}`);
  ;(() => {})(`   Status     : ${target.status}`);
  ;(() => {})(`   Deskripsi  : ${target.description}`);
  ;(() => {})(`   Tgl Transaksi: ${target.transactionDate.toISOString()}`);
  ;(() => {})(`   Period     : ${target.period?.periodName}`);
  ;(() => {})(`   Ref Number : ${target.referenceNumber}`);
  ;(() => {})(`   Ref Type   : ${target.referenceType}`);
  ;(() => {})(`   Lines      : ${target.ledgerLines.length} baris\n`);

  if (target.status === 'VOID') {
    console.warn(`⚠️  Ledger ini sudah VOID sebelumnya. Tidak ada perubahan.`);
    process.exit(0);
  }

  if (target.status === 'LOCKED' || target.status === 'RECONCILED') {
    console.error(`❌ Ledger status ${target.status} tidak dapat dibatalkan.`);
    process.exit(1);
  }

  ;(() => {})('📋 Detail Baris Jurnal:');
  for (const line of target.ledgerLines) {
    ;(() => {})(`   Line ${line.lineNumber}: [${line.coa.code}] ${line.coa.name}`);
    ;(() => {})(`            Debit: ${line.debitAmount.toLocaleString('id-ID')} | Kredit: ${line.creditAmount.toLocaleString('id-ID')}`);
  }

  ;(() => {})('\n🔄 Memulai proses VOID dalam transaksi...\n');

  const result = await prisma.$transaction(async (tx) => {
    // Reverse GeneralLedgerSummary & TrialBalance for each line
    for (const line of target.ledgerLines) {
      const normalizedDate = normalizeToJakartaStartOfDay(target.transactionDate);

      // --- GeneralLedgerSummary ---
      const summary = await tx.generalLedgerSummary.findUnique({
        where: {
          coaId_periodId_date: {
            coaId: line.coaId,
            periodId: target.periodId,
            date: normalizedDate,
          },
        },
      });

      if (summary) {
        const newDebit = Math.max(0, Number(summary.debitTotal) - line.debitAmount);
        const newCredit = Math.max(0, Number(summary.creditTotal) - line.creditAmount);
        const newClosing = Number(summary.openingBalance) + newDebit - newCredit;

        await tx.generalLedgerSummary.update({
          where: {
            coaId_periodId_date: {
              coaId: line.coaId,
              periodId: target.periodId,
              date: normalizedDate,
            },
          },
          data: {
            debitTotal: newDebit,
            creditTotal: newCredit,
            closingBalance: newClosing,
            transactionCount: { decrement: 1 },
          },
        });
        ;(() => {})(`   ✅ GL Summary reversed untuk akun: [${line.coa.code}] ${line.coa.name}`);
      } else {
        console.warn(`   ⚠️  GL Summary tidak ditemukan untuk akun: [${line.coa.code}] ${line.coa.name}`);
      }

      // --- TrialBalance ---
      const tb = await tx.trialBalance.findUnique({
        where: { periodId_coaId: { periodId: target.periodId, coaId: line.coaId } },
      });

      if (tb) {
        const newPeriodDebit = Math.max(0, Number(tb.periodDebit) - line.debitAmount);
        const newPeriodCredit = Math.max(0, Number(tb.periodCredit) - line.creditAmount);
        const newEndingDebit = Number(tb.openingDebit) + newPeriodDebit;
        const newEndingCredit = Number(tb.openingCredit) + newPeriodCredit;

        await tx.trialBalance.update({
          where: { periodId_coaId: { periodId: target.periodId, coaId: line.coaId } },
          data: {
            periodDebit: newPeriodDebit,
            periodCredit: newPeriodCredit,
            endingDebit: newEndingDebit,
            endingCredit: newEndingCredit,
            ytdDebit: newEndingDebit,
            ytdCredit: newEndingCredit,
            calculatedAt: new Date(),
          },
        });
        ;(() => {})(`   ✅ Trial Balance reversed untuk akun: [${line.coa.code}] ${line.coa.name}`);
      } else {
        console.warn(`   ⚠️  Trial Balance tidak ditemukan untuk akun: [${line.coa.code}] ${line.coa.name}`);
      }
    }

    // Mark Ledger as VOID
    const voidedLedger = await tx.ledger.update({
      where: { id: target.id },
      data: {
        status: 'VOID',
        voidBy: VOIDED_BY,
        voidAt: new Date(),
        voidReason: VOID_REASON,
      },
    });
    ;(() => {})(`\n✅ Ledger ${LEDGER_NUMBER} status diubah ke: VOID`);

    // Revert Pinjaman to DRAFT if this is a loan posting
    if (target.referenceType === 'JOURNAL' && target.referenceNumber?.startsWith('LOAN-')) {
      const loanShortId = target.referenceNumber.replace('LOAN-', '').toLowerCase();
      const pinjaman = await tx.pinjaman.findFirst({
        where: { id: { startsWith: loanShortId } },
      });
      if (pinjaman && pinjaman.status === 'ACTIVE') {
        await tx.pinjaman.update({
          where: { id: pinjaman.id },
          data: { status: 'DRAFT' },
        });
        ;(() => {})(`✅ Pinjaman ${pinjaman.id} dikembalikan ke status DRAFT`);
      }
    }

    return voidedLedger;
  });

  ;(() => {})('\n🎉 SELESAI! Ringkasan:');
  ;(() => {})(`   Ledger Number : ${result.ledgerNumber}`);
  ;(() => {})(`   Status Baru   : ${result.status}`);
  ;(() => {})(`   Void By       : ${result.voidBy}`);
  ;(() => {})(`   Void At       : ${result.voidAt?.toISOString()}`);
  ;(() => {})(`   Alasan        : ${result.voidReason}`);
  ;(() => {})('\n✅ Laporan keuangan (GL Summary & Trial Balance) telah disesuaikan.\n');
}

voidLedger()
  .catch((e) => {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
