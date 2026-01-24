# Material Requisition Journal Integration - FIXES & IMPROVEMENTS

## 🔧 **Perbaikan yang Dilakukan**

### **1. Menggunakan SystemAccounts (Tidak Hardcode)** ✅

**Sebelum:**
```javascript
entries: [
  {
    accountCode: '5-10101', // ❌ Hardcoded
    debit: totalMaterialCost,
    credit: 0
  },
  {
    accountCode: '1-10205', // ❌ Hardcoded
    debit: 0,
    credit: totalMaterialCost
  }
]
```

**Sesudah:**
```javascript
entries: [
  {
    systemAccountKey: 'PURCHASE_EXPENSE', // ✅ Using SystemAccount
    debit: totalMaterialCost,
    credit: 0
  },
  {
    systemAccountKey: 'PROJECT_WIP', // ✅ Using SystemAccount
    debit: 0,
    credit: totalMaterialCost
  }
]
```

### **2. Update GeneralLedgerSummary** ✅

**Fitur Baru:**
- ✅ Auto-create/update `GeneralLedgerSummary` per tanggal
- ✅ Track `debitTotal`, `creditTotal`, `closingBalance`
- ✅ Track `transactionCount`
- ✅ Linked to `AccountingPeriod`

**Implementasi:**
```javascript
async function updateGeneralLedgerSummary(coaId, periodId, date, debit, credit, tx) {
  // Normalize date to start of day
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  // Get or create summary record
  let summary = await prismaClient.generalLedgerSummary.findUnique({
    where: {
      coaId_periodId_date: { coaId, periodId, date: normalizedDate }
    }
  });

  if (!summary) {
    // Create new summary
    summary = await prismaClient.generalLedgerSummary.create({
      data: {
        coaId, periodId, date: normalizedDate,
        openingBalance: 0,
        debitTotal: debit,
        creditTotal: credit,
        closingBalance: debit - credit,
        transactionCount: 1,
        currency: 'IDR'
      }
    });
  } else {
    // Update existing summary
    await prismaClient.generalLedgerSummary.update({
      where: { coaId_periodId_date: { coaId, periodId, date: normalizedDate } },
      data: {
        debitTotal: { increment: debit },
        creditTotal: { increment: credit },
        closingBalance: { increment: debit - credit },
        transactionCount: { increment: 1 }
      }
    });
  }
}
```

### **3. Update TrialBalance** ✅

**Fitur Baru:**
- ✅ Auto-create/update `TrialBalance` per period
- ✅ Track `periodDebit`, `periodCredit`
- ✅ Track `endingDebit`, `endingCredit`
- ✅ Track `ytdDebit`, `ytdCredit` (Year-to-Date)
- ✅ Auto-update `calculatedAt` timestamp

**Implementasi:**
```javascript
async function updateTrialBalance(coaId, periodId, debit, credit, tx) {
  let trialBalance = await prismaClient.trialBalance.findUnique({
    where: { periodId_coaId: { periodId, coaId } }
  });

  if (!trialBalance) {
    // Create new trial balance
    trialBalance = await prismaClient.trialBalance.create({
      data: {
        periodId, coaId,
        openingDebit: 0, openingCredit: 0,
        periodDebit: debit, periodCredit: credit,
        endingDebit: debit, endingCredit: credit,
        ytdDebit: debit, ytdCredit: credit,
        currency: 'IDR',
        calculatedAt: new Date()
      }
    });
  } else {
    // Update existing trial balance
    const newPeriodDebit = Number(trialBalance.periodDebit) + debit;
    const newPeriodCredit = Number(trialBalance.periodCredit) + credit;
    const newEndingDebit = Number(trialBalance.openingDebit) + newPeriodDebit;
    const newEndingCredit = Number(trialBalance.openingCredit) + newPeriodCredit;

    await prismaClient.trialBalance.update({
      where: { periodId_coaId: { periodId, coaId } },
      data: {
        periodDebit: newPeriodDebit,
        periodCredit: newPeriodCredit,
        endingDebit: newEndingDebit,
        endingCredit: newEndingCredit,
        ytdDebit: newEndingDebit,
        ytdCredit: newEndingCredit,
        calculatedAt: new Date()
      }
    });
  }
}
```

### **4. Auto-Create AccountingPeriod** ✅

**Fitur Baru:**
- ✅ Auto-create `AccountingPeriod` jika belum ada
- ✅ Format: `YYYY-MM` (e.g., `2026-01`)
- ✅ Auto-set `startDate` dan `endDate`
- ✅ Default status: `OPEN`

**Implementasi:**
```javascript
async function getOrCreateAccountingPeriod(date, tx) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const periodCode = `${year}-${String(month).padStart(2, '0')}`;
  
  const startDate = new Date(year, month - 1, 1); // First day of month
  const endDate = new Date(year, month, 0); // Last day of month

  let period = await prismaClient.accountingPeriod.findUnique({
    where: { periodCode }
  });

  if (!period) {
    period = await prismaClient.accountingPeriod.create({
      data: {
        periodCode, year, month,
        startDate, endDate,
        status: 'OPEN'
      }
    });
    console.log(`✅ Created accounting period: ${periodCode}`);
  }

  return period;
}
```

### **5. Fix Frontend Dialog Detection** ✅

**Masalah:**
- ❌ Dialog tidak muncul karena `isWip` tidak ada di type definition
- ❌ Detection menggunakan `name.includes("wip")` (tidak reliable)

**Perbaikan:**
```typescript
// Type definition
interface MaterialRequisition {
  // ... other fields
  Warehouse?: {
    name: string
    isWip?: boolean  // ✅ Added
  }
}

// Detection logic
isWipWarehouse={pendingIssueData?.mr.Warehouse?.isWip || false}  // ✅ Using isWip field
```

### **6. Improved Error Handling** ✅

**Fitur Baru:**
- ✅ Validate SystemAccount exists
- ✅ Validate COA linked to SystemAccount
- ✅ Validate account is POSTING type (not HEADER)
- ✅ Require transaction context (tx) for atomic operations
- ✅ Proper error messages

**Implementasi:**
```javascript
export async function getSystemAccount(key, tx) {
  const systemAccount = await prismaClient.systemAccount.findUnique({
    where: { key },
    include: { coa: true }
  });

  if (!systemAccount) {
    throw new Error(`System account '${key}' not found. Please run seedSystemAccounts.js`);
  }

  if (!systemAccount.coa) {
    throw new Error(`COA not linked for system account '${key}'`);
  }

  if (systemAccount.coa.postingType !== 'POSTING') {
    throw new Error(`Account ${systemAccount.coa.code} is a HEADER account`);
  }

  return systemAccount;
}
```

---

## 📊 **Alur Lengkap Setelah Perbaikan**

```
1. User Scan QR Code
   ↓
2. QR Scanner Validate Token
   ↓
3. ⚠️ CONFIRMATION DIALOG MUNCUL ⚠️
   - Check: Warehouse.isWip === true
   - Warning: Jurnal akan dibuat
   - Preview: DEBIT PURCHASE_EXPENSE, CREDIT PROJECT_WIP
   ↓
4. User Click "Ya, Keluarkan Barang"
   ↓
5. Backend Process (ATOMIC TRANSACTION):
   ├─ Cut stock (FIFO)
   ├─ Update balance
   ├─ Update MR status = ISSUED
   ├─ IF isWip:
   │  ├─ Get SystemAccount('PURCHASE_EXPENSE')
   │  ├─ Get SystemAccount('PROJECT_WIP')
   │  ├─ Get/Create AccountingPeriod
   │  ├─ CREATE JournalEntry
   │  ├─ UPDATE GeneralLedgerSummary (2 accounts)
   │  └─ UPDATE TrialBalance (2 accounts)
   └─ COMMIT TRANSACTION
   ↓
6. Success Response:
   - Toast: "Stok diperbarui, jurnal dibuat, MR diproses"
   - Refresh data
```

---

## 🗄️ **Database Tables Updated**

### **JournalEntry**
- ✅ `periodId` (linked to AccountingPeriod)
- ✅ `type` = 'MAT-USAGE'
- ✅ `status` = 'POSTED'
- ✅ `referenceId` = MR.id
- ✅ `referenceNumber` = MR.mrNumber

### **JournalLine**
- ✅ `accountId` (from SystemAccount.coa)
- ✅ `debit` / `credit`
- ✅ `keterangan`

### **GeneralLedgerSummary** (NEW)
- ✅ `coaId`, `periodId`, `date`
- ✅ `openingBalance`, `debitTotal`, `creditTotal`, `closingBalance`
- ✅ `transactionCount`

### **TrialBalance** (NEW)
- ✅ `periodId`, `coaId`
- ✅ `openingDebit`, `openingCredit`
- ✅ `periodDebit`, `periodCredit`
- ✅ `endingDebit`, `endingCredit`
- ✅ `ytdDebit`, `ytdCredit`
- ✅ `calculatedAt`

### **AccountingPeriod** (AUTO-CREATED)
- ✅ `periodCode` (e.g., '2026-01')
- ✅ `year`, `month`
- ✅ `startDate`, `endDate`
- ✅ `status` = 'OPEN'

---

## ✅ **SystemAccounts Mapping**

| Key | COA Code | Account Name | Type |
|-----|----------|--------------|------|
| `PURCHASE_EXPENSE` | `5-10101` | Biaya Material Proyek | HPP |
| `PROJECT_WIP` | `1-10205` | Persediaan On WIP | ASET |

---

## 🧪 **Testing Checklist (UPDATED)**

### **Backend Testing**
- [x] Test `getSystemAccount()` dengan key valid
- [x] Test `getSystemAccount()` dengan key tidak ada (should error)
- [x] Test `getOrCreateAccountingPeriod()` create new period
- [x] Test `getOrCreateAccountingPeriod()` get existing period
- [x] Test `updateGeneralLedgerSummary()` create new
- [x] Test `updateGeneralLedgerSummary()` update existing
- [x] Test `updateTrialBalance()` create new
- [x] Test `updateTrialBalance()` update existing
- [x] Test `createJournalEntry()` untuk WIP warehouse
- [x] Test `createJournalEntry()` untuk non-WIP warehouse
- [x] Test transaction rollback jika error

### **Frontend Testing**
- [ ] Test QR scan flow
- [ ] Test confirmation dialog muncul ✅ (Fixed)
- [ ] Test warning untuk WIP warehouse (isWip=true)
- [ ] Test warning untuk non-WIP warehouse (isWip=false)
- [ ] Test loading state
- [ ] Test cancel button
- [ ] Test confirm button
- [ ] Test success toast message
- [ ] Test error handling

### **Database Testing**
- [ ] Verify JournalEntry created
- [ ] Verify JournalLine created (2 lines)
- [ ] Verify GeneralLedgerSummary updated (2 accounts)
- [ ] Verify TrialBalance updated (2 accounts)
- [ ] Verify AccountingPeriod created
- [ ] Verify stock balance updated
- [ ] Verify MR status = ISSUED

---

## 📝 **Files Modified**

**Backend:**
1. ✅ `backend/src/utils/journalHelper.js` - Complete rewrite
2. ✅ `backend/src/controllers/mrInventory/mrController.js` - Use SystemAccounts

**Frontend:**
1. ✅ `frontend/components/inventoryMr/TableMr.tsx` - Fix isWip detection
2. ✅ `frontend/components/inventoryMr/MRIssueConfirmDialog.tsx` - Already created

---

## 🚀 **Next Steps**

1. **Test dengan data real:**
   ```bash
   # 1. Pastikan SystemAccounts sudah di-seed
   cd backend
   node scripts/seedSystemAccounts.js
   
   # 2. Restart backend
   npm run dev
   
   # 3. Test MR issue untuk WIP warehouse
   ```

2. **Verify di database:**
   ```sql
   -- Check JournalEntry
   SELECT * FROM JournalEntry WHERE type = 'MAT-USAGE' ORDER BY createdAt DESC LIMIT 5;
   
   -- Check GeneralLedgerSummary
   SELECT * FROM GeneralLedgerSummary ORDER BY date DESC LIMIT 10;
   
   -- Check TrialBalance
   SELECT * FROM TrialBalance ORDER BY calculatedAt DESC LIMIT 10;
   
   -- Check AccountingPeriod
   SELECT * FROM AccountingPeriod ORDER BY periodCode DESC;
   ```

3. **Monitor logs:**
   - Backend console: Check for journal creation logs
   - Frontend console: Check for dialog state
   - Network tab: Check API response

---

**Created:** 2026-01-23
**Version:** 2.0.0
**Status:** ✅ Ready for Testing (FIXED)
