# MR Journal Creation - WIP Warehouse Validation Test

## 🎯 **Objective**
Memastikan jurnal akuntansi **HANYA** dibuat untuk warehouse dengan `isWip = true`

---

## ✅ **Validation Logic**

### **Backend Code (mrController.js)**

```javascript
// Line 384-436
// ===== AUTO-CREATE JOURNAL FOR WIP WAREHOUSE ONLY =====
// IMPORTANT: Journal creation ONLY happens if warehouse.isWip === true
console.log(`🔍 Checking warehouse for journal creation:`, {
  warehouseName: updatedMR.Warehouse?.name,
  isWip: updatedMR.Warehouse?.isWip,
  mrNumber: updatedMR.mrNumber
});

// Explicit check: ONLY process if isWip is explicitly true
if (updatedMR.Warehouse && updatedMR.Warehouse.isWip === true) {
  // CREATE JOURNAL
} else {
  // NO JOURNAL - Log reason
  const reason = !updatedMR.Warehouse 
    ? 'Warehouse data not found' 
    : updatedMR.Warehouse.isWip === false 
      ? 'Warehouse isWip=false (not a WIP warehouse)'
      : 'Warehouse isWip is null/undefined';
  
  console.log(`ℹ️ No journal created - Reason: ${reason}`);
}
```

### **Key Validations:**
1. ✅ `updatedMR.Warehouse` must exist
2. ✅ `updatedMR.Warehouse.isWip` must be **explicitly `true`**
3. ✅ Not just truthy, but **`=== true`**

---

## 🧪 **Test Cases**

### **Test Case 1: WIP Warehouse (isWip = true)** ✅

**Setup:**
```sql
-- Warehouse with isWip = true
UPDATE Warehouse SET isWip = true WHERE code = 'WIP';
```

**Expected Behavior:**
- ✅ Journal **SHOULD** be created
- ✅ Console log: `✅ WIP Warehouse detected (isWip=true)`
- ✅ Console log: `✅ Journal entry created successfully`
- ✅ Database: JournalEntry created
- ✅ Database: GeneralLedgerSummary updated
- ✅ Database: TrialBalance updated

**Verification:**
```sql
-- Check journal created
SELECT * FROM JournalEntry 
WHERE type = 'MAT-USAGE' 
  AND referenceNumber = 'MR-202601-XXXX'
ORDER BY createdAt DESC;

-- Should return 1 row
```

---

### **Test Case 2: Non-WIP Warehouse (isWip = false)** ❌

**Setup:**
```sql
-- Warehouse with isWip = false
UPDATE Warehouse SET isWip = false WHERE code = 'BENGKEL';
```

**Expected Behavior:**
- ❌ Journal **SHOULD NOT** be created
- ✅ Console log: `ℹ️ No journal created - Reason: Warehouse isWip=false (not a WIP warehouse)`
- ❌ Database: No JournalEntry created
- ❌ Database: No GeneralLedgerSummary update
- ❌ Database: No TrialBalance update

**Verification:**
```sql
-- Check no journal created
SELECT * FROM JournalEntry 
WHERE type = 'MAT-USAGE' 
  AND referenceNumber = 'MR-202601-XXXX';

-- Should return 0 rows
```

---

### **Test Case 3: Warehouse with isWip = null** ❌

**Setup:**
```sql
-- Warehouse with isWip = null
UPDATE Warehouse SET isWip = null WHERE code = 'KEBON';
```

**Expected Behavior:**
- ❌ Journal **SHOULD NOT** be created
- ✅ Console log: `ℹ️ No journal created - Reason: Warehouse isWip is null/undefined`
- ❌ Database: No JournalEntry created

---

### **Test Case 4: Warehouse data not found** ❌

**Setup:**
```javascript
// MR without warehouseId or Warehouse relation
```

**Expected Behavior:**
- ❌ Journal **SHOULD NOT** be created
- ✅ Console log: `ℹ️ No journal created - Reason: Warehouse data not found`
- ❌ Database: No JournalEntry created

---

### **Test Case 5: WIP Warehouse but totalCost = 0** ⚠️

**Setup:**
```sql
-- WIP warehouse but items have no price
UPDATE Warehouse SET isWip = true WHERE code = 'WIP';
-- Items with priceUnit = 0 or null
```

**Expected Behavior:**
- ⚠️ Journal **SHOULD NOT** be created (no cost to record)
- ✅ Console log: `⚠️ No journal created - Total cost is 0 (no material cost calculated)`
- ❌ Database: No JournalEntry created

**Reason:** Tidak ada nilai yang perlu dijurnal

---

## 📊 **Test Matrix**

| # | Warehouse | isWip | totalCost | Journal Created? | Console Log |
|---|-----------|-------|-----------|------------------|-------------|
| 1 | WIP | `true` | > 0 | ✅ YES | `✅ Journal entry created successfully` |
| 2 | BENGKEL | `false` | > 0 | ❌ NO | `ℹ️ Reason: isWip=false` |
| 3 | KEBON | `null` | > 0 | ❌ NO | `ℹ️ Reason: isWip is null/undefined` |
| 4 | (none) | - | > 0 | ❌ NO | `ℹ️ Reason: Warehouse data not found` |
| 5 | WIP | `true` | 0 | ❌ NO | `⚠️ Total cost is 0` |

---

## 🔍 **How to Test**

### **1. Check Warehouse isWip Status**
```sql
SELECT id, code, name, isWip 
FROM Warehouse 
ORDER BY isWip DESC, name;
```

### **2. Create MR for Each Warehouse Type**
```bash
# Test with WIP warehouse
# Test with non-WIP warehouse
# Test with null isWip warehouse
```

### **3. Monitor Backend Console**
Look for these logs:
```
🔍 Checking warehouse for journal creation: { warehouseName: '...', isWip: true/false/null, mrNumber: '...' }
```

### **4. Verify Database**
```sql
-- Count journals created today
SELECT 
  COUNT(*) as journal_count,
  SUM(totalDebit) as total_amount
FROM JournalEntry 
WHERE type = 'MAT-USAGE' 
  AND DATE(tanggal) = CURDATE();

-- Check which MRs created journals
SELECT 
  je.journalNumber,
  je.referenceNumber as mrNumber,
  je.totalDebit,
  je.tanggal,
  w.name as warehouseName,
  w.isWip
FROM JournalEntry je
JOIN MaterialRequisition mr ON je.referenceId = mr.id
JOIN Warehouse w ON mr.warehouseId = w.id
WHERE je.type = 'MAT-USAGE'
ORDER BY je.createdAt DESC
LIMIT 10;
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Journal created for non-WIP warehouse**
**Symptom:** Journal exists for warehouse with `isWip=false`

**Check:**
```sql
-- Verify warehouse isWip status
SELECT w.code, w.name, w.isWip, mr.mrNumber
FROM MaterialRequisition mr
JOIN Warehouse w ON mr.warehouseId = w.id
WHERE mr.mrNumber = 'MR-202601-XXXX';
```

**Solution:** 
- Check backend code at line 393
- Ensure condition is `if (updatedMR.Warehouse && updatedMR.Warehouse.isWip === true)`

---

### **Issue 2: No journal for WIP warehouse**
**Symptom:** No journal created even though `isWip=true`

**Check Backend Console:**
```
🔍 Checking warehouse for journal creation: { ... }
💰 Total material cost calculated: 0  <-- PROBLEM!
```

**Possible Causes:**
1. `priceUnit` is 0 or null for all items
2. `qtyIssued` is 0
3. Calculation error

**Solution:**
```sql
-- Check item prices
SELECT 
  mri.id,
  mri.qtyRequested,
  mri.qtyIssued,
  mri.priceUnit,
  (mri.qtyIssued * mri.priceUnit) as totalCost
FROM MaterialRequisitionItem mri
WHERE mri.materialRequisitionId = 'xxx';
```

---

### **Issue 3: Warehouse.isWip is null**
**Symptom:** Console shows `isWip is null/undefined`

**Check:**
```sql
-- Check warehouse isWip value
SELECT id, code, name, isWip 
FROM Warehouse 
WHERE id = 'xxx';
```

**Solution:**
```sql
-- Set isWip explicitly
UPDATE Warehouse 
SET isWip = true 
WHERE code = 'WIP';

UPDATE Warehouse 
SET isWip = false 
WHERE code IN ('BENGKEL', 'KEBON', 'B_ZAENAL');
```

---

## ✅ **Validation Checklist**

Before deploying, verify:

- [ ] Backend code has explicit `=== true` check
- [ ] Console logs show warehouse info before journal creation
- [ ] Test Case 1 (WIP, isWip=true) → Journal created ✅
- [ ] Test Case 2 (Non-WIP, isWip=false) → No journal ❌
- [ ] Test Case 3 (isWip=null) → No journal ❌
- [ ] Test Case 4 (No warehouse) → No journal ❌
- [ ] Test Case 5 (totalCost=0) → No journal ❌
- [ ] Database: Only WIP warehouses have journals
- [ ] Frontend dialog shows correct warning for WIP only

---

## 📝 **Expected Console Output**

### **For WIP Warehouse (isWip=true):**
```
🔍 Checking warehouse for journal creation: { warehouseName: 'GUDANG WIP PROJECT', isWip: true, mrNumber: 'MR-202601-0001' }
✅ WIP Warehouse detected (isWip=true). Creating journal entry for: MR-202601-0001
💰 Total material cost calculated: 1500000
📝 Creating journal with accounts: { debitAccount: 'PURCHASE_EXPENSE', creditAccount: 'PROJECT_WIP', amount: 1500000 }
✅ Created accounting period: 2026-01
✅ Journal Created: JV-MAT-USAGE-202601-0001 | Debit: 1500000 | Credit: 1500000
✅ Updated GeneralLedgerSummary and TrialBalance for 2 accounts
✅ Journal entry created successfully for WIP material usage: MR-202601-0001 | Amount: 1500000
```

### **For Non-WIP Warehouse (isWip=false):**
```
🔍 Checking warehouse for journal creation: { warehouseName: 'GUDANG PUSAT (BENGKEL)', isWip: false, mrNumber: 'MR-202601-0002' }
ℹ️ No journal created for MR-202601-0002 - Reason: Warehouse isWip=false (not a WIP warehouse)
```

---

**Created:** 2026-01-23  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing
