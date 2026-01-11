# FINANCIAL SUMMARIES AUTO-UPDATE

## Overview
Setiap payment transaction otomatis mengupdate **Trial Balance** dan **General Ledger Summary** secara real-time.

---

## 🎯 Tables yang Diupdate

### 1. ✅ **Ledger & LedgerLine** (Primary)
- Setiap payment membuat 1 Ledger + 2-3 LedgerLines
- Status langsung `POSTED`
- Nomor jurnal: `JV-PAY-YYYYMMDD-XXXX`

### 2. ✅ **TrialBalance** (Auto-Updated)
- Update per COA per Period
- Fields updated:
  - `periodDebit` - Total debit periode berjalan
  - `periodCredit` - Total credit periode berjalan
  - `endingDebit` - Saldo akhir debit
  - `endingCredit` - Saldo akhir credit
  - `ytdDebit` - Year-to-date debit
  - `ytdCredit` - Year-to-date credit

### 3. ✅ **GeneralLedgerSummary** (Auto-Updated)
- Update per COA per Period per Date (daily)
- Fields updated:
  - `debitTotal` - Total debit hari ini
  - `creditTotal` - Total credit hari ini
  - `closingBalance` - Saldo penutup
  - `transactionCount` - Jumlah transaksi

### 4. ❌ **FinancialReport** (On-Demand)
- **TIDAK** auto-update
- Generated saat user request
- Mengambil data dari TrialBalance & GLSummary

### 5. ❌ **FinancialReportSection** (On-Demand)
- **TIDAK** auto-update
- Generated saat user request report
- Calculated berdasarkan formula

---

## 📊 Contoh Update Flow

### Payment Transaction:
```
Invoice: INV-001
Amount: Rp 10.000.000
Admin Fee: Rp 10.000
Date: 2026-01-11
Period: JAN-2026
```

### 1. Ledger & LedgerLines Created:
```
Ledger: JV-PAY-20260111-0001

LedgerLine 1:
  COA: 1-10002 (Bank BRI)
  Debit: 9.990.000
  Credit: 0

LedgerLine 2:
  COA: 6-10102 (Beban Admin)
  Debit: 10.000
  Credit: 0

LedgerLine 3:
  COA: 1-10101 (Piutang)
  Debit: 0
  Credit: 10.000.000
```

### 2. Trial Balance Updated:
```sql
-- COA: 1-10002 (Bank BRI)
UPDATE TrialBalance SET
  periodDebit = periodDebit + 9990000,
  endingDebit = endingDebit + 9990000,
  ytdDebit = ytdDebit + 9990000,
  calculatedAt = NOW()
WHERE periodId = 'JAN-2026' AND coaId = '1-10002';

-- COA: 6-10102 (Beban Admin)
UPDATE TrialBalance SET
  periodDebit = periodDebit + 10000,
  endingDebit = endingDebit + 10000,
  ytdDebit = ytdDebit + 10000,
  calculatedAt = NOW()
WHERE periodId = 'JAN-2026' AND coaId = '6-10102';

-- COA: 1-10101 (Piutang)
UPDATE TrialBalance SET
  periodCredit = periodCredit + 10000000,
  endingCredit = endingCredit + 10000000,
  ytdCredit = ytdCredit + 10000000,
  calculatedAt = NOW()
WHERE periodId = 'JAN-2026' AND coaId = '1-10101';
```

### 3. GL Summary Updated:
```sql
-- COA: 1-10002, Date: 2026-01-11
UPDATE GeneralLedgerSummary SET
  debitTotal = debitTotal + 9990000,
  closingBalance = closingBalance + 9990000,
  transactionCount = transactionCount + 1
WHERE coaId = '1-10002' 
  AND periodId = 'JAN-2026' 
  AND date = '2026-01-11';

-- COA: 6-10102, Date: 2026-01-11
UPDATE GeneralLedgerSummary SET
  debitTotal = debitTotal + 10000,
  closingBalance = closingBalance + 10000,
  transactionCount = transactionCount + 1
WHERE coaId = '6-10102' 
  AND periodId = 'JAN-2026' 
  AND date = '2026-01-11';

-- COA: 1-10101, Date: 2026-01-11
UPDATE GeneralLedgerSummary SET
  creditTotal = creditTotal + 10000000,
  closingBalance = closingBalance - 10000000,
  transactionCount = transactionCount + 1
WHERE coaId = '1-10101' 
  AND periodId = 'JAN-2026' 
  AND date = '2026-01-11';
```

---

## 🔧 Implementation Details

### Service: `financialSummaryService.js`

**Functions:**

1. **`updateTrialBalance(params)`**
   - Update atau create Trial Balance record
   - Called setelah create ledger lines
   - Upsert logic (create if not exists)

2. **`updateGeneralLedgerSummary(params)`**
   - Update atau create GL Summary record
   - Called setelah create ledger lines
   - Calculate opening balance from previous day

3. **`recalculateTrialBalance(periodId)`**
   - Batch recalculation untuk seluruh period
   - Useful untuk period closing atau data correction

4. **`recalculateGLSummary({ periodId, startDate, endDate })`**
   - Batch recalculation untuk date range
   - Useful untuk data correction

---

## 📝 Usage Examples

### 1. Auto-Update (Already Implemented)
```javascript
// Di paymentLedgerService.js
// Setelah create ledger lines, otomatis update summaries

for (const line of ledgerLines) {
  await updateTrialBalance({
    periodId: period.id,
    coaId: line.coaId,
    debitAmount: line.debitAmount,
    creditAmount: line.creditAmount,
    tx
  });

  await updateGeneralLedgerSummary({
    coaId: line.coaId,
    periodId: period.id,
    date: paymentDate,
    debitAmount: line.debitAmount,
    creditAmount: line.creditAmount,
    tx
  });
}
```

### 2. Manual Recalculation
```javascript
// Recalculate Trial Balance untuk periode tertentu
const result = await recalculateTrialBalance('period-id-jan-2026');
console.log(`Updated ${result.accountsUpdated} accounts`);

// Recalculate GL Summary untuk date range
const glResult = await recalculateGLSummary({
  periodId: 'period-id-jan-2026',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31')
});
console.log(`Updated ${glResult.summariesUpdated} summaries`);
```

### 3. Generate Financial Report (Future)
```javascript
// Financial Report di-generate on-demand dari Trial Balance
async function generateBalanceSheet(periodId) {
  const trialBalance = await prisma.trialBalance.findMany({
    where: { periodId },
    include: { coa: true }
  });

  // Group by account type
  const assets = trialBalance.filter(tb => tb.coa.accountType === 'ASET');
  const liabilities = trialBalance.filter(tb => tb.coa.accountType === 'LIABILITAS');
  const equity = trialBalance.filter(tb => tb.coa.accountType === 'EKUITAS');

  return {
    assets: calculateTotal(assets),
    liabilities: calculateTotal(liabilities),
    equity: calculateTotal(equity)
  };
}
```

---

## 🧪 Testing

### Test 1: Verify Trial Balance Update
```sql
-- Before payment
SELECT * FROM "TrialBalance" 
WHERE "periodId" = 'period-id' 
  AND "coaId" IN ('1-10002', '6-10102', '1-10101');

-- Process payment (amount: 10M, admin: 10K)

-- After payment - verify updates
SELECT 
  coa.code,
  coa.name,
  tb."periodDebit",
  tb."periodCredit",
  tb."endingDebit",
  tb."endingCredit"
FROM "TrialBalance" tb
JOIN "ChartOfAccounts" coa ON tb."coaId" = coa.id
WHERE tb."periodId" = 'period-id' 
  AND coa.code IN ('1-10002', '6-10102', '1-10101');

-- Expected:
-- 1-10002: periodDebit +9,990,000
-- 6-10102: periodDebit +10,000
-- 1-10101: periodCredit +10,000,000
```

### Test 2: Verify GL Summary Update
```sql
-- Check daily summary
SELECT 
  coa.code,
  coa.name,
  gls.date,
  gls."debitTotal",
  gls."creditTotal",
  gls."closingBalance",
  gls."transactionCount"
FROM "GeneralLedgerSummary" gls
JOIN "ChartOfAccounts" coa ON gls."coaId" = coa.id
WHERE gls."periodId" = 'period-id'
  AND gls.date = '2026-01-11'
  AND coa.code IN ('1-10002', '6-10102', '1-10101');

-- Expected:
-- 1-10002: debitTotal +9,990,000, transactionCount +1
-- 6-10102: debitTotal +10,000, transactionCount +1
-- 1-10101: creditTotal +10,000,000, transactionCount +1
```

### Test 3: Verify Balance Equation
```sql
-- Trial Balance harus balanced
SELECT 
  "periodId",
  SUM("periodDebit") as total_debit,
  SUM("periodCredit") as total_credit,
  SUM("periodDebit") - SUM("periodCredit") as difference
FROM "TrialBalance"
WHERE "periodId" = 'period-id'
GROUP BY "periodId";

-- Expected: difference = 0
```

---

## 🚨 Important Notes

### 1. Transaction Integrity
- Semua update (Ledger, Trial Balance, GL Summary) dalam **1 transaction**
- Jika salah satu gagal, semua di-rollback
- Ensures data consistency

### 2. Performance Considerations
- Trial Balance: 1 record per COA per Period (~100-500 records)
- GL Summary: 1 record per COA per Day (~3,000-15,000 records/month)
- Indexed by: `periodId`, `coaId`, `date`

### 3. Opening Balance Calculation
- GL Summary opening balance = previous day closing balance
- Trial Balance opening balance = previous period ending balance
- **TODO**: Implement proper opening balance calculation for period start

### 4. Year-to-Date (YTD) Calculation
- Currently: YTD = Period total (simplified)
- **TODO**: Implement proper YTD calculation across periods

---

## 📋 Maintenance Tasks

### Monthly Tasks:
- [ ] Verify Trial Balance balanced
- [ ] Verify GL Summary totals match Ledger
- [ ] Generate monthly financial reports
- [ ] Close accounting period

### Quarterly Tasks:
- [ ] Recalculate Trial Balance for all periods
- [ ] Verify YTD calculations
- [ ] Generate quarterly reports

### Yearly Tasks:
- [ ] Year-end closing
- [ ] Carry forward balances to new year
- [ ] Archive old data

---

## 🔄 Future Enhancements

### Phase 2:
- [ ] Implement proper opening balance calculation
- [ ] Implement YTD calculation across periods
- [ ] Add budget vs actual comparison
- [ ] Add variance analysis

### Phase 3:
- [ ] Auto-generate financial reports
- [ ] Email scheduled reports
- [ ] Dashboard with real-time charts
- [ ] Multi-currency support

---

**Created:** 11 Januari 2026  
**Version:** 1.0  
**Status:** ✅ IMPLEMENTED
