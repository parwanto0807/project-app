# MR Journal Posting - Separate Button Implementation

## 🎯 **New Flow**

### **Before (Auto-posting):**
```
Approve MR → Status ISSUED + Journal Created (automatic)
```

### **After (Manual posting):**
```
1. Approve MR → Status ISSUED (stock cut)
   ↓
2. Button "Posting" appears for ISSUED MRs
   ↓
3. Click "Posting" → Confirmation dialog
   ↓
4. Confirm → Journal created
```

---

## 🔧 **Changes Made**

### **1. Backend - mrController.js**

#### **A. Disabled Auto Journal Creation in `issueMR`**
```javascript
// Line 393-482: Commented out auto journal creation
// Journal will be created separately via posting button
console.log(`ℹ️ MR ${updatedMR.mrNumber} issued successfully. Journal can be posted separately.`);
```

#### **B. Added New Endpoint `postMRJournal`**
```javascript
// Line 494-629: New endpoint
postMRJournal: async (req, res) => {
  const { mrId } = req.body;
  
  // Validations:
  // 1. MR exists
  // 2. Status = ISSUED
  // 3. No existing journal
  // 4. WIP warehouse only
  // 5. Total cost > 0
  
  // Create journal entry
  // Return journal number
}
```

**Validations:**
- ✅ MR must exist
- ✅ Status must be `ISSUED`
- ✅ No duplicate journal (check existing)
- ✅ Only WIP warehouses (`isWip = true`)
- ✅ Total cost must be > 0

---

### **2. Backend - mrRoutes.js**

```javascript
// Added new route
router.post('/post-journal', mrController.postMRJournal);
```

**Endpoint:** `POST /api/mr/post-journal`

**Request Body:**
```json
{
  "mrId": "uuid-here"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "mr": { ... },
    "journal": {
      "journalNumber": "JV-MAT-USAGE-202601-0001",
      ...
    }
  },
  "message": "Journal JV-MAT-USAGE-202601-0001 berhasil diposting untuk MR-202601-0001"
}
```

**Error Responses:**
```json
// MR not found
{ "success": false, "error": "Material Requisition not found" }

// Wrong status
{ "success": false, "error": "Cannot post journal for MR with status PENDING. MR must be ISSUED first." }

// Already posted
{ "success": false, "error": "Journal already posted for MR-202601-0001 (JV-MAT-USAGE-202601-0001)" }

// Not WIP warehouse
{ "success": false, "error": "Journal posting only allowed for WIP warehouses" }

// Zero cost
{ "success": false, "error": "Cannot post journal with zero or negative cost" }
```

---

### **3. Frontend - mrInventroyAction.ts**

```typescript
// Added new action
export async function postMRJournal(
    mrId: string
): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_URL}/api/mr/post-journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mrId })
    });
    
    return await response.json();
}
```

---

## 📊 **Complete Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                     USER ACTIONS                             │
└─────────────────────────────────────────────────────────────┘

1. Click "Approve" on PENDING MR
   ↓
2. QR Scanner Dialog opens
   ↓
3. Scan QR or Input Manual
   ↓
4. Confirmation Dialog (optional - can be removed now)
   ↓
5. Confirm
   ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND: issueMR                           │
│  - Cut stock (FIFO)                                          │
│  - Update balance                                            │
│  - Status → ISSUED                                           │
│  - ❌ NO JOURNAL CREATED                                     │
└─────────────────────────────────────────────────────────────┘
   ↓
6. MR Status = ISSUED
   ↓
7. Button "Posting" appears (for WIP warehouse only)
   ↓
8. Click "Posting"
   ↓
9. Confirmation Dialog
   - Warning: Journal akan dibuat
   - Preview: DEBIT/CREDIT accounts
   - Irreversible action
   ↓
10. Confirm
   ↓
┌─────────────────────────────────────────────────────────────┐
│                BACKEND: postMRJournal                        │
│  - Validate MR status = ISSUED                               │
│  - Validate WIP warehouse                                    │
│  - Check no duplicate journal                                │
│  - Calculate total cost                                      │
│  - Create journal entry                                      │
│  - Update GeneralLedgerSummary                               │
│  - Update TrialBalance                                       │
└─────────────────────────────────────────────────────────────┘
   ↓
11. Success Toast
   ↓
12. Journal appears in ledger: JV-MAT-USAGE-202601-XXXX
```

---

## 🎨 **Frontend Implementation (Next Step)**

### **Button Location:**
Add "Posting" button in TableMr.tsx for MRs with:
- `status = 'ISSUED'`
- `Warehouse.isWip = true`
- No existing journal

### **Button Component:**
```tsx
{mr.status === 'ISSUED' && mr.Warehouse?.isWip && !mr.hasJournal && (
  <Button
    onClick={() => handlePostJournal(mr)}
    variant="default"
    size="sm"
  >
    <FileText className="h-4 w-4 mr-2" />
    Posting
  </Button>
)}
```

### **Handler Function:**
```tsx
const handlePostJournal = async (mr: MaterialRequisition) => {
  // Show confirmation dialog
  setSelectedMR(mr);
  setShowPostingConfirmDialog(true);
};

const confirmPostJournal = async () => {
  if (!selectedMR) return;
  
  try {
    setIsPosting(true);
    
    const result = await postMRJournal(selectedMR.id);
    
    if (result.success) {
      toast.success("Journal berhasil diposting!", {
        description: result.message
      });
      onRefresh();
    } else {
      toast.error("Gagal posting journal", {
        description: result.error
      });
    }
  } catch (error: any) {
    toast.error("Terjadi kesalahan", {
      description: error.message
    });
  } finally {
    setIsPosting(false);
    setShowPostingConfirmDialog(false);
  }
};
```

---

## ✅ **Benefits of This Approach**

1. **Better Control** ✅
   - User can review MR before posting journal
   - Separation of concerns (stock vs accounting)

2. **Error Recovery** ✅
   - If journal creation fails, MR is still ISSUED
   - Can retry posting without re-issuing

3. **Audit Trail** ✅
   - Clear separation between stock movement and accounting
   - Easier to track when journal was posted

4. **Flexibility** ✅
   - Can post journal at different time
   - Can batch post multiple MRs

5. **Testing** ✅
   - Easier to test stock movement separately
   - Easier to test journal creation separately

---

## 🧪 **Testing Steps**

### **1. Test Issue MR (Without Journal)**
```
1. Approve MR
2. Verify: Status = ISSUED
3. Verify: Stock cut (FIFO)
4. Verify: NO journal created
5. Verify: "Posting" button appears
```

### **2. Test Post Journal**
```
1. Click "Posting" button
2. Verify: Confirmation dialog shows
3. Confirm
4. Verify: Journal created (JV-MAT-USAGE-...)
5. Verify: GeneralLedgerSummary updated
6. Verify: TrialBalance updated
7. Verify: "Posting" button disappears
```

### **3. Test Validations**
```
# Already posted
1. Try to post journal again
2. Verify: Error "Journal already posted"

# Wrong status
1. Try to post journal for PENDING MR
2. Verify: Error "MR must be ISSUED first"

# Non-WIP warehouse
1. Try to post journal for non-WIP MR
2. Verify: Error "Only allowed for WIP warehouses"
```

---

## 📝 **Database Queries for Testing**

### **Check ISSUED MRs without Journal:**
```sql
SELECT 
  mr.id,
  mr.mrNumber,
  mr.status,
  w.name as warehouse,
  w.isWip,
  je.journalNumber
FROM MaterialRequisition mr
JOIN Warehouse w ON mr.warehouseId = w.id
LEFT JOIN JournalEntry je ON je.type = 'MAT-USAGE' AND je.referenceId = mr.id
WHERE mr.status = 'ISSUED'
  AND w.isWip = true
  AND je.id IS NULL
ORDER BY mr.createdAt DESC;
```

### **Check Posted Journals:**
```sql
SELECT 
  je.journalNumber,
  je.referenceNumber as mrNumber,
  je.totalDebit,
  je.tanggal,
  je.createdAt
FROM JournalEntry je
WHERE je.type = 'MAT-USAGE'
ORDER BY je.createdAt DESC
LIMIT 10;
```

---

## 🚀 **Next Steps**

1. ✅ Backend implemented
2. ✅ Route added
3. ✅ Frontend action created
4. ⏳ **TODO:** Add "Posting" button in TableMr.tsx
5. ⏳ **TODO:** Add confirmation dialog for posting
6. ⏳ **TODO:** Test complete flow

---

**Created:** 2026-01-23  
**Version:** 2.0.0  
**Status:** ✅ Backend Complete, Frontend Pending
