# MR Journal - PR Number Traceability

## 🎯 **Objective**
Menambahkan nomor PR (Purchase Request) ke dalam keterangan jurnal untuk traceability yang lebih baik.

---

## 📊 **Relasi Database**

```
MaterialRequisitionItem
  ↓ (purchaseRequestDetailId)
PurchaseRequestDetail
  ↓ (purchaseRequestId)
PurchaseRequest
  → nomorPr
```

---

## 🔧 **Implementation**

### **1. Include PR Data in Query**

**Location:** `backend/src/controllers/mrInventory/mrController.js` (Line 357-391)

```javascript
const updatedMR = await tx.materialRequisition.update({
  where: { id: mr.id },
  include: {
    items: {
      include: {
        product: { ... },
        purchaseRequestDetail: {  // ✅ Added
          include: {
            purchaseRequest: {
              select: {
                nomorPr: true  // ✅ Get PR number
              }
            }
          }
        }
      }
    },
    Warehouse: { ... }
  }
});
```

### **2. Extract PR Numbers from Items**

**Location:** `backend/src/controllers/mrInventory/mrController.js` (Line 416-425)

```javascript
// Extract unique PR numbers from items
const prNumbers = [...new Set(
  updatedMR.items
    .map(item => item.purchaseRequestDetail?.purchaseRequest?.nomorPr)
    .filter(Boolean)  // Remove null/undefined
)];

const prNumbersText = prNumbers.length > 0 
  ? ` | PR: ${prNumbers.join(', ')}` 
  : '';
```

**Example Output:**
- Single PR: ` | PR: PR-UM-RA-FNC-00013-I-2026`
- Multiple PRs: ` | PR: PR-UM-RA-FNC-00013-I-2026, PR-UM-RA-FNC-00014-I-2026`
- No PR: `` (empty string)

### **3. Add to Journal Description**

**Journal Entry Keterangan:**
```javascript
keterangan: `Pemakaian Material Proyek - ${mrNumber}${projectId}${prNumbersText}`
```

**Example:**
```
Pemakaian Material Proyek - MR-202601-0001 (Project ID: abc123) | PR: PR-UM-RA-FNC-00013-I-2026
```

**Journal Line Keterangan:**
```javascript
// Debit line
keterangan: `Material usage - ${mrNumber}${prNumbersText}`

// Credit line
keterangan: `Stock reduction from ${warehouseName}${prNumbersText}`
```

**Example:**
```
Material usage - MR-202601-0001 | PR: PR-UM-RA-FNC-00013-I-2026
Stock reduction from GUDANG WIP PROJECT | PR: PR-UM-RA-FNC-00013-I-2026
```

---

## 📝 **Sample Journal Entry**

### **Scenario:**
- MR Number: `MR-202601-0001`
- Project ID: `abc123`
- PR Numbers: `PR-UM-RA-FNC-00013-I-2026`, `PR-UM-RA-FNC-00014-I-2026`
- Total Cost: Rp 1.500.000

### **Journal Entry:**

```
JV-MAT-USAGE-202601-0001
Tanggal: 2026-01-23
Keterangan: Pemakaian Material Proyek - MR-202601-0001 (Project ID: abc123) | PR: PR-UM-RA-FNC-00013-I-2026, PR-UM-RA-FNC-00014-I-2026

Line 1:
  Account: 5-10101 Biaya Material Proyek
  Debit: Rp 1.500.000
  Credit: Rp 0
  Keterangan: Material usage - MR-202601-0001 | PR: PR-UM-RA-FNC-00013-I-2026, PR-UM-RA-FNC-00014-I-2026

Line 2:
  Account: 1-10205 Persediaan On WIP
  Debit: Rp 0
  Credit: Rp 1.500.000
  Keterangan: Stock reduction from GUDANG WIP PROJECT | PR: PR-UM-RA-FNC-00013-I-2026, PR-UM-RA-FNC-00014-I-2026
```

---

## 🧪 **Test Cases**

### **Test Case 1: Single PR**

**Setup:**
- MR has 3 items, all from same PR: `PR-UM-RA-FNC-00013-I-2026`

**Expected:**
```
Keterangan: Pemakaian Material Proyek - MR-202601-0001 | PR: PR-UM-RA-FNC-00013-I-2026
```

### **Test Case 2: Multiple PRs**

**Setup:**
- MR has 5 items:
  - 3 items from `PR-UM-RA-FNC-00013-I-2026`
  - 2 items from `PR-UM-RA-FNC-00014-I-2026`

**Expected:**
```
Keterangan: Pemakaian Material Proyek - MR-202601-0001 | PR: PR-UM-RA-FNC-00013-I-2026, PR-UM-RA-FNC-00014-I-2026
```

### **Test Case 3: No PR (Internal Stock)**

**Setup:**
- MR items have no `purchaseRequestDetailId` (internal stock movement)

**Expected:**
```
Keterangan: Pemakaian Material Proyek - MR-202601-0001
```
(No PR text appended)

### **Test Case 4: Mixed (Some with PR, Some without)**

**Setup:**
- MR has 4 items:
  - 2 items from `PR-UM-RA-FNC-00013-I-2026`
  - 2 items with no PR link

**Expected:**
```
Keterangan: Pemakaian Material Proyek - MR-202601-0001 | PR: PR-UM-RA-FNC-00013-I-2026
```
(Only shows PRs that exist)

---

## 🔍 **Verification Queries**

### **Check Journal with PR Numbers**

```sql
-- View journal entries with PR numbers
SELECT 
  je.journalNumber,
  je.referenceNumber as mrNumber,
  je.keterangan,
  je.totalDebit,
  je.tanggal
FROM JournalEntry je
WHERE je.type = 'MAT-USAGE'
  AND je.keterangan LIKE '%PR:%'
ORDER BY je.createdAt DESC
LIMIT 10;
```

### **Check Journal Lines with PR Numbers**

```sql
-- View journal lines with PR traceability
SELECT 
  jl.lineNumber,
  coa.code as accountCode,
  coa.name as accountName,
  jl.debit,
  jl.credit,
  jl.keterangan
FROM JournalLine jl
JOIN JournalEntry je ON jl.journalEntryId = je.id
JOIN ChartOfAccounts coa ON jl.accountId = coa.id
WHERE je.type = 'MAT-USAGE'
  AND jl.keterangan LIKE '%PR:%'
ORDER BY je.createdAt DESC, jl.lineNumber ASC
LIMIT 20;
```

### **Trace MR to PR**

```sql
-- Trace which PRs are linked to an MR
SELECT DISTINCT
  mr.mrNumber,
  pr.nomorPr,
  COUNT(mri.id) as itemCount
FROM MaterialRequisition mr
JOIN MaterialRequisitionItem mri ON mr.id = mri.materialRequisitionId
LEFT JOIN PurchaseRequestDetail prd ON mri.purchaseRequestDetailId = prd.id
LEFT JOIN PurchaseRequest pr ON prd.purchaseRequestId = pr.id
WHERE mr.mrNumber = 'MR-202601-0001'
GROUP BY mr.mrNumber, pr.nomorPr;
```

---

## 📊 **Console Log Output**

### **With PR Numbers:**
```
📝 Creating journal with accounts: {
  debitAccount: 'PURCHASE_EXPENSE',
  creditAccount: 'PROJECT_WIP',
  amount: 1500000,
  prNumbers: [ 'PR-UM-RA-FNC-00013-I-2026', 'PR-UM-RA-FNC-00014-I-2026' ]
}
```

### **Without PR Numbers:**
```
📝 Creating journal with accounts: {
  debitAccount: 'PURCHASE_EXPENSE',
  creditAccount: 'PROJECT_WIP',
  amount: 1500000,
  prNumbers: 'No PR linked'
}
```

---

## ✅ **Benefits**

1. **Traceability** ✅
   - Easy to trace journal back to original PR
   - Audit trail improvement

2. **Reporting** ✅
   - Can filter journals by PR number
   - Better cost tracking per PR

3. **Debugging** ✅
   - Easier to identify which PR caused journal
   - Better error investigation

4. **Compliance** ✅
   - Better documentation for auditors
   - Clear paper trail

---

## 🚀 **Usage Example**

### **Scenario: Material Purchase via Uang Muka**

1. **PR Created:** `PR-UM-RA-FNC-00013-I-2026`
2. **UM Disbursed:** Rp 2.500.000
3. **Material Received:** GRN created, stock in WIP
4. **MR Created:** `MR-202601-0001` (linked to PR items)
5. **MR Issued:** Material used in project
6. **Journal Created:**
   ```
   JV-MAT-USAGE-202601-0001
   Keterangan: Pemakaian Material Proyek - MR-202601-0001 | PR: PR-UM-RA-FNC-00013-I-2026
   
   DEBIT:  5-10101 Biaya Material Proyek     Rp 1.500.000
   CREDIT: 1-10205 Persediaan On WIP         Rp 1.500.000
   ```

7. **Traceability:**
   - From Journal → Find MR-202601-0001
   - From MR → Find PR-UM-RA-FNC-00013-I-2026
   - From PR → Find UM, GRN, Invoice, etc.

---

## 📚 **Related Documentation**

- Main Implementation: `.docs/MR_JOURNAL_INTEGRATION_FIXES.md`
- WIP Validation: `.docs/MR_WIP_WAREHOUSE_VALIDATION_TEST.md`

---

**Created:** 2026-01-23  
**Version:** 1.0.0  
**Status:** ✅ Implemented
