# Accounting Module Audit — Findings & Fixes

## Fixes Applied (code)

1. `backend/src/utils/journalHelper.js`
   - `getOrCreateAccountingPeriod`: throw jika period `isClosed` (mencegah posting ke periode tertutup).
   - Validasi balance: toleransi 0.01 dihapus → strict equality berbasis scaled integer (sen).
2. `backend/src/services/accounting/closingService.js`
   - `rolloverTrialBalances`: cabang credit-normal (Liability/Equity/Revenue) dibetulkan — sebelumnya terbalik (endD/endC tertukar).
   - `performClosing`: langkah baru (guarded) memindahkan laba/rugi berjalan ke Laba Ditahan via SystemAccount key `RETAINED_EARNINGS` di next period (jika dikonfigurasi).
3. `backend/src/controllers/accounting/periodController.js`
   - `updatePeriod`: guard period tertutup (tidak bisa edit tanggal periode closed).
4. `backend/src/controllers/accounting/ledgerController.js`
   - `voidLedger`: guard period tertutup.

## Findings Belum Diperbaiki (butuh migrasi/pekerjaan lebih besar)

- Float → Decimal pada `LedgerLine`, `TrialBalance`, `GeneralLedgerSummary`, `FinancialReportSection`, `Ledger.exchangeRate` (schema migration).
- `financialReportService.js`: Income Statement kini agregasi dari TrialBalance (period movement) per periode akuntansi; Balance Sheet & Cash Flow masih agregasi `ledgerLine` mentah → refactor selanjutnya.
- `financialSummaryService.js`: `updateTrialBalance`/`recalculateTrialBalance` netting & YTD semantics tidak konsisten dengan rollover.
- `closingService.performClosing`: belum memposting Laba/Rugi ke Retained Earnings (Laba Ditahan) dan belum menutup akun nominal ke equity.
- `reopenPeriod`: hanya flip flag, tidak membalik rollover/retained earnings.
- `journalHelper` money masih `Number` (disarankan Decimal/BigInt satuan sen).
- `JournalEntryLine` tidak ada constraint DB mencegah debit & kredit keduanya positif.

## Verifikasi

- `node --check` pada file yang diubah: PASS.
- Backend tests: 20/20 pass.
- Security smoke: 11/11 pass.

## Rekomendasi Lanjutan

Prioritaskan (1) migrasi Float→Decimal + penggunaan Decimal di service, (2) refactor financialReportService untuk membaca dari TrialBalance, (3) implementasi retained earnings closing di performClosing, (4) guard reopenPeriod dengan reversal.
