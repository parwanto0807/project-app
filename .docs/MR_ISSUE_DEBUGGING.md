# MR Issue Debugging - Checklist

## 🔍 **Problem: Dialog tidak muncul & Journal tidak dibuat**

### **Kemungkinan Penyebab:**

1. ❌ MR bukan dari WIP warehouse
2. ❌ MR sudah di-issue sebelumnya
3. ❌ Frontend error (dialog tidak render)
4. ❌ Backend error (journal creation failed)

---

## ✅ **Debugging Steps**

### **Step 1: Cek MR Status & Warehouse**

```sql
-- Check MR yang akan di-approve
SELECT 
  mr.id,
  mr.mrNumber,
  mr.status,
  mr.qrToken,
  w.name as warehouseName,
  w.isWip,
  w.code as warehouseCode
FROM MaterialRequisition mr
JOIN Warehouse w ON mr.warehouseId = w.id
WHERE mr.status = 'PENDING'
ORDER BY mr.createdAt DESC
LIMIT 10;
```

**Expected:**
- `status` = `'PENDING'` atau `'READY_TO_PICKUP'`
- `isWip` = `true` (untuk create journal)

**If `isWip` = `false`:**
- ✅ Dialog akan muncul TAPI tanpa warning journal
- ❌ Journal TIDAK akan dibuat (by design)

---

### **Step 2: Cek Browser Console**

**Buka Browser Console (F12)**, lalu:

1. Click "Approve" button
2. Click "Input Manual"
3. Paste token
4. Click OK

**Expected Console Output:**
```
🔍 QR Scanned successfully: [token]
🔍 Selected MR: [id]
🔍 Selected MR Warehouse: { name: "...", isWip: true/false }
🔍 Closing QR Scanner...
🔍 Setting pending issue data...
🔍 Opening confirmation dialog...
✅ Confirmation dialog should now be visible
```

**If NO logs appear:**
- ❌ `onScanSuccess` tidak terpanggil
- Check: Token match dengan `expectedToken`?

**If error appears:**
- Check error message
- Possible: Component render error

---

### **Step 3: Cek Backend Console**

**Setelah confirm di dialog**, backend console harus show:

```
🔍 Checking warehouse for journal creation: {
  warehouseName: '...',
  isWip: true/false,
  mrNumber: '...'
}
```

**If `isWip: true`:**
```
✅ WIP Warehouse detected (isWip=true). Creating journal entry for: MR-...
💰 Total material cost calculated: [amount]
📝 Creating journal with accounts: { ... }
✅ Created accounting period: 2026-01
✅ Journal Created: JV-MAT-USAGE-202601-XXXX
✅ Updated GeneralLedgerSummary and TrialBalance for 2 accounts
✅ Journal entry created successfully for WIP material usage: MR-...
```

**If `isWip: false`:**
```
ℹ️ No journal created for MR-... - Reason: Warehouse isWip=false (not a WIP warehouse)
```

**If NO logs appear:**
- ❌ API call failed
- Check network tab for errors

---

### **Step 4: Cek Network Tab**

**Browser DevTools → Network Tab**

1. Filter: `issueMR`
2. Check request payload
3. Check response

**Expected Request:**
```json
{
  "qrToken": "...",
  "issuedById": "temp-user-id"
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Barang berhasil dikeluarkan (Stok terpotong)"
}
```

**If Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

### **Step 5: Cek Material Cost**

```sql
-- Check if items have price
SELECT 
  mri.id,
  mr.mrNumber,
  p.name as productName,
  mri.qtyRequested,
  mri.qtyIssued,
  mri.priceUnit,
  (mri.qtyIssued * mri.priceUnit) as totalCost
FROM MaterialRequisitionItem mri
JOIN MaterialRequisition mr ON mri.materialRequisitionId = mr.id
JOIN Product p ON mri.productId = p.id
WHERE mr.mrNumber = 'MR-202601-XXXX'  -- Replace with your MR number
ORDER BY mri.id;
```

**Expected:**
- `priceUnit` > 0
- `totalCost` > 0

**If `priceUnit` = 0:**
- ⚠️ Journal will NOT be created (no cost to record)
- Backend log: `⚠️ No journal created - Total cost is 0`

---

### **Step 6: Verify Warehouse isWip**

```sql
-- Check all warehouses
SELECT 
  id,
  code,
  name,
  isWip,
  inventoryAccountId
FROM Warehouse
ORDER BY isWip DESC, name;
```

**Expected:**
- At least ONE warehouse with `isWip = true`

**If ALL warehouses have `isWip = false` or `null`:**
```sql
-- Fix: Set WIP warehouse
UPDATE Warehouse 
SET isWip = true 
WHERE code = 'WIP' OR name LIKE '%WIP%';

-- Verify
SELECT code, name, isWip FROM Warehouse WHERE isWip = true;
```

---

### **Step 7: Check SystemAccounts**

```sql
-- Verify system accounts exist
SELECT 
  sa.key,
  sa.description,
  coa.code,
  coa.name,
  coa.postingType
FROM SystemAccount sa
LEFT JOIN ChartOfAccounts coa ON sa.coaId = coa.id
WHERE sa.key IN ('PURCHASE_EXPENSE', 'PROJECT_WIP');
```

**Expected:**
```
PURCHASE_EXPENSE | 5-10101 | Biaya Material Proyek | POSTING
PROJECT_WIP      | 1-10205 | Persediaan On WIP     | POSTING
```

**If NOT found:**
```bash
# Run seed script
cd backend
node scripts/seedSystemAccounts.js
```

---

## 🧪 **Quick Test Scenario**

### **Create Test MR for WIP Warehouse:**

```sql
-- 1. Find WIP warehouse
SELECT id, name FROM Warehouse WHERE isWip = true LIMIT 1;
-- Result: id = 'xxx', name = 'GUDANG WIP PROJECT'

-- 2. Find a product
SELECT id, name FROM Product LIMIT 1;
-- Result: id = 'yyy', name = 'Product A'

-- 3. Create test MR (via UI or direct insert)
-- Use the WIP warehouse ID from step 1

-- 4. Approve the MR
-- 5. Check if journal created
SELECT * FROM JournalEntry WHERE type = 'MAT-USAGE' ORDER BY createdAt DESC LIMIT 1;
```

---

## 📊 **Troubleshooting Matrix**

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| Dialog tidak muncul | Frontend error | Check browser console |
| Dialog muncul tapi no warning | `isWip = false` | Normal, no journal will be created |
| Dialog muncul dengan warning | `isWip = true` | ✅ Correct |
| Journal tidak dibuat (`isWip=true`) | `priceUnit = 0` | Check item prices |
| Journal tidak dibuat (`isWip=true`) | SystemAccount missing | Run seedSystemAccounts.js |
| Backend error | Account not found | Check SystemAccount & COA |
| Backend error | Period creation failed | Check AccountingPeriod table |

---

## 🎯 **Expected Full Flow**

### **For WIP Warehouse (isWip=true):**

1. ✅ Click "Approve"
2. ✅ QR Scanner opens
3. ✅ Click "Input Manual"
4. ✅ Paste token
5. ✅ Success animation
6. ✅ **Confirmation dialog appears**
7. ✅ Warning shows: "Jurnal Akuntansi Akan Dibuat"
8. ✅ Click "Ya, Keluarkan Barang"
9. ✅ Backend creates journal
10. ✅ Toast: "Stok diperbarui, jurnal dibuat, MR diproses"
11. ✅ Journal appears in ledger: `JV-MAT-USAGE-202601-XXXX`

### **For Non-WIP Warehouse (isWip=false):**

1. ✅ Click "Approve"
2. ✅ QR Scanner opens
3. ✅ Click "Input Manual"
4. ✅ Paste token
5. ✅ Success animation
6. ✅ **Confirmation dialog appears**
7. ❌ NO warning about journal
8. ✅ Click "Ya, Keluarkan Barang"
9. ❌ Backend does NOT create journal
10. ✅ Toast: "Stok diperbarui, MR diproses"
11. ❌ NO journal in ledger

---

## 🚀 **Action Items**

**Please run these queries and share results:**

```sql
-- 1. Check MR you're trying to approve
SELECT 
  mr.mrNumber,
  mr.status,
  w.name as warehouse,
  w.isWip,
  COUNT(mri.id) as itemCount
FROM MaterialRequisition mr
JOIN Warehouse w ON mr.warehouseId = w.id
LEFT JOIN MaterialRequisitionItem mri ON mr.id = mri.materialRequisitionId
WHERE mr.status IN ('PENDING', 'READY_TO_PICKUP')
GROUP BY mr.id, mr.mrNumber, mr.status, w.name, w.isWip
ORDER BY mr.createdAt DESC
LIMIT 5;

-- 2. Check if any journals exist
SELECT 
  journalNumber,
  type,
  referenceNumber,
  totalDebit,
  tanggal
FROM JournalEntry
WHERE type = 'MAT-USAGE'
ORDER BY createdAt DESC
LIMIT 5;

-- 3. Check SystemAccounts
SELECT sa.key, coa.code, coa.name
FROM SystemAccount sa
LEFT JOIN ChartOfAccounts coa ON sa.coaId = coa.id
WHERE sa.key IN ('PURCHASE_EXPENSE', 'PROJECT_WIP');
```

---

**Created:** 2026-01-23  
**Version:** 1.0.0  
**Status:** 🔍 Debugging
