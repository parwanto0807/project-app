# Material Requisition Journal Integration - Implementation Summary

## 📋 Overview
Implementasi otomatis pembuatan jurnal akuntansi saat pengeluaran barang dari gudang WIP (Work in Progress) melalui Material Requisition (MR).

## 🎯 Tujuan
- Mencatat biaya material proyek (HPP) secara otomatis saat material dikeluarkan dari gudang WIP
- Memberikan warning kepada user bahwa tindakan tidak dapat dibatalkan
- Memastikan integritas data antara inventory dan accounting

## 🏗️ Arsitektur Implementasi

### **1. Backend Components**

#### **A. Journal Helper Utility** (`backend/src/utils/journalHelper.js`)
**Fungsi:**
- `createJournalEntry()` - Membuat jurnal dengan validasi dan penomoran otomatis
- `getWarehouseInventoryAccount()` - Mendapatkan kode akun persediaan berdasarkan gudang
- `validateJournalAccounts()` - Validasi keberadaan akun COA

**Fitur:**
- ✅ Auto-numbering dengan format: `JV-{TYPE}-{YYYYMM}-{SEQUENCE}`
- ✅ Validasi balance (Debit = Credit)
- ✅ Validasi akun harus POSTING type (bukan HEADER)
- ✅ Support transaction context untuk atomic operations

#### **B. MR Controller Modification** (`backend/src/controllers/mrInventory/mrController.js`)
**Perubahan pada fungsi `issueMR`:**

**Sebelum:**
```javascript
// 3. Update Status MR Header
return await tx.materialRequisition.update({
  where: { id: mr.id },
  data: { status: 'ISSUED', issuedById, updatedAt: new Date() }
});
```

**Sesudah:**
```javascript
// 3. Update Status MR Header and fetch warehouse info
const updatedMR = await tx.materialRequisition.update({
  where: { id: mr.id },
  data: { status: 'ISSUED', issuedById, updatedAt: new Date() },
  include: {
    items: { include: { product: true } },
    Warehouse: { include: { inventoryAccount: true } }
  }
});

// ===== AUTO-CREATE JOURNAL FOR WIP WAREHOUSE =====
if (updatedMR.Warehouse?.isWip) {
  const totalMaterialCost = updatedMR.items.reduce((sum, item) => {
    return sum + (Number(item.qtyIssued) * Number(item.priceUnit || 0));
  }, 0);

  if (totalMaterialCost > 0) {
    await createJournalEntry({
      type: 'MAT-USAGE',
      referenceId: updatedMR.id,
      referenceNumber: updatedMR.mrNumber,
      tanggal: new Date(),
      keterangan: `Pemakaian Material Proyek - ${updatedMR.mrNumber}`,
      entries: [
        {
          accountCode: '5-10101', // Biaya Material Proyek (HPP)
          debit: totalMaterialCost,
          credit: 0
        },
        {
          accountCode: inventoryAccountCode, // Persediaan On WIP
          debit: 0,
          credit: totalMaterialCost
        }
      ],
      tx
    });
  }
}
```

### **2. Frontend Components**

#### **A. Confirmation Dialog** (`frontend/components/inventoryMr/MRIssueConfirmDialog.tsx`)
**Fitur:**
- ✅ Warning untuk WIP warehouse (akan create jurnal)
- ✅ Preview jurnal yang akan dibuat (DEBIT/CREDIT)
- ✅ Warning irreversible action
- ✅ Display MR number dan total amount
- ✅ Loading state saat processing

**Props:**
```typescript
interface MRIssueConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  mrNumber: string;
  isWipWarehouse: boolean;
  totalAmount?: number;
  isLoading?: boolean;
}
```

#### **B. Table MR Modification** (`frontend/components/inventoryMr/TableMr.tsx`)
**Perubahan:**
1. Import `MRIssueConfirmDialog`
2. Tambah state:
   ```typescript
   const [showConfirmDialog, setShowConfirmDialog] = useState(false)
   const [pendingIssueData, setPendingIssueData] = useState<{
     scannedToken: string;
     mr: MaterialRequisition;
   } | null>(null)
   ```
3. Modifikasi `QRScannerDialog.onScanSuccess`:
   - **Sebelum:** Langsung call `issueMR()` API
   - **Sesudah:** Simpan data ke state dan show confirmation dialog
4. Tambah `MRIssueConfirmDialog` component dengan handler

## 📊 Flow Diagram

```
┌─────────────────┐
│  User Scan QR   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ QRScannerDialog         │
│ - Validate Token        │
│ - Close Scanner         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ MRIssueConfirmDialog    │
│ ┌─────────────────────┐ │
│ │ ⚠️ Warning:         │ │
│ │ - WIP Warehouse?    │ │
│ │ - Journal Preview   │ │
│ │ - Irreversible      │ │
│ └─────────────────────┘ │
│                         │
│  [Batal] [Ya, Lanjut]   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Backend: issueMR()      │
│ ┌─────────────────────┐ │
│ │ 1. FIFO Stock Cut   │ │
│ │ 2. Update Balance   │ │
│ │ 3. Update MR Status │ │
│ │ 4. IF isWip:        │ │
│ │    ├─ Calc Cost     │ │
│ │    └─ Create Journal│ │
│ └─────────────────────┘ │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Success Response        │
│ - Toast Notification    │
│ - Refresh Data          │
└─────────────────────────┘
```

## 🧾 Jurnal yang Dibuat

### **Untuk Gudang WIP (isWip = true)**
```
JV-MAT-USAGE-202601-0001
Tanggal: [Tanggal Issue]
Keterangan: Pemakaian Material Proyek - MR-202601-0001

DEBIT:  5-10101 Biaya Material Proyek      Rp 1.500.000
CREDIT: 1-10205 Persediaan On WIP          Rp 1.500.000
```

### **Untuk Gudang Non-WIP**
❌ **Tidak ada jurnal** - Hanya update stock balance

## ✅ Testing Checklist

### **Backend Testing**
- [ ] Test `createJournalEntry()` dengan data valid
- [ ] Test validasi balance (Debit ≠ Credit)
- [ ] Test validasi akun tidak ada
- [ ] Test validasi akun HEADER (harus error)
- [ ] Test `issueMR()` untuk WIP warehouse
- [ ] Test `issueMR()` untuk non-WIP warehouse
- [ ] Test transaction rollback jika jurnal gagal

### **Frontend Testing**
- [ ] Test QR scan flow
- [ ] Test confirmation dialog muncul
- [ ] Test warning untuk WIP warehouse
- [ ] Test warning untuk non-WIP warehouse
- [ ] Test loading state
- [ ] Test cancel button
- [ ] Test confirm button
- [ ] Test success toast message
- [ ] Test error handling

## 🔐 Security & Validation

### **Backend**
- ✅ Transaction-based (atomic operation)
- ✅ Validation akun COA exists
- ✅ Validation akun type = POSTING
- ✅ Validation balance
- ✅ Error handling dengan rollback

### **Frontend**
- ✅ Confirmation dialog (prevent accidental action)
- ✅ Clear warning messages
- ✅ Loading state (prevent double-click)
- ✅ Error toast notification

## 📝 Notes

### **Akun yang Digunakan**
| Kode | Nama | Tipe | Normal Balance |
|------|------|------|----------------|
| `5-10101` | Biaya Material Proyek | HPP | DEBIT |
| `1-10205` | Persediaan On WIP | ASET | DEBIT |
| `1-10202` | Persediaan - Gudang Pusat (BENGKEL) | ASET | DEBIT |
| `1-10203` | Persediaan - Gudang Cabang KEBON | ASET | DEBIT |
| `1-10204` | Persediaan - Gudang Cabang B Zaenal | ASET | DEBIT |

### **TODO Items**
1. ⚠️ Get `issuedById` from auth session (currently hardcoded)
2. ⚠️ Display actual material cost in confirmation dialog
3. ⚠️ Add journal preview in MR detail sheet
4. ⚠️ Add journal history link in success toast

### **Future Enhancements**
1. 📊 Dashboard untuk monitoring material usage
2. 📈 Report HPP per project
3. 🔔 Notification untuk finance team saat jurnal dibuat
4. 📧 Email notification untuk manager
5. 🔍 Audit log untuk journal creation

## 🚀 Deployment Steps

1. **Backend:**
   ```bash
   cd backend
   # No migration needed (using existing tables)
   npm run dev
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Testing:**
   - Create MR for WIP warehouse
   - Scan QR code
   - Verify confirmation dialog appears
   - Confirm and check journal created
   - Verify stock updated

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check console logs (backend & frontend)
2. Check journal entry table
3. Check stock balance table
4. Verify warehouse `isWip` flag

---

**Created:** 2026-01-23
**Version:** 1.0.0
**Status:** ✅ Ready for Testing
