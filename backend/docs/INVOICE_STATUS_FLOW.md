# INVOICE STATUS FLOW - FINAL IMPLEMENTATION

## 📊 **Dual Status System**

Invoice menggunakan **2 status terpisah** untuk informasi yang jelas:

### **1. `status` (Payment Status)**
Menunjukkan **status pembayaran**:
- `DRAFT` - Invoice masih draft
- `UNPAID` - Sudah di-posting ke GL, belum dibayar
- `PARTIALLY_PAID` - Sebagian sudah dibayar
- `PAID` - Lunas
- `OVERDUE` - Lewat jatuh tempo
- `CANCELLED` - Dibatalkan

### **2. `approvalStatus` (Approval & Posting Status)**
Menunjukkan **status approval & posting ke GL**:
- `PENDING` - Menunggu approval
- `APPROVED` - Sudah disetujui, belum di-posting
- `POSTED` - Sudah di-posting ke General Ledger
- `REJECTED` - Ditolak
- `VOID` - Dibatalkan setelah posting

---

## 🔄 **Complete Flow**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CREATE INVOICE                                           │
│    status: DRAFT                                            │
│    approvalStatus: PENDING                                  │
│    Action: [Edit] [Submit for Approval]                    │
└─────────────────────────────────────────────────────────────┘
                        ↓ Submit for Approval
┌─────────────────────────────────────────────────────────────┐
│ 2. WAITING APPROVAL                                         │
│    status: DRAFT                                            │
│    approvalStatus: PENDING                                  │
│    Action: [Approve] [Reject]                              │
└─────────────────────────────────────────────────────────────┘
                        ↓ Approve
┌─────────────────────────────────────────────────────────────┐
│ 3. APPROVED (Not Posted Yet)                               │
│    status: DRAFT                                            │
│    approvalStatus: APPROVED                                 │
│    Action: [Post to Journal]                               │
└─────────────────────────────────────────────────────────────┘
                        ↓ Post to Journal
┌─────────────────────────────────────────────────────────────┐
│ 4. POSTED & UNPAID ✅                                       │
│    status: UNPAID                                           │
│    approvalStatus: POSTED                                   │
│    balanceDue: Rp 10.000.000                               │
│    Ledger: JV-SI-INV-001 (Created)                         │
│    Action: [Pay]                                            │
│    Info: "Sudah di-posting ke GL, menunggu pembayaran"     │
└─────────────────────────────────────────────────────────────┘
                        ↓ Receive Payment (Partial: Rp 5M)
┌─────────────────────────────────────────────────────────────┐
│ 5. PARTIALLY PAID 🟠                                        │
│    status: PARTIALLY_PAID                                   │
│    approvalStatus: POSTED                                   │
│    paidTotal: Rp 5.000.000                                 │
│    balanceDue: Rp 5.000.000                                │
│    Ledger: JV-PAY-20260111-0001 (Created)                  │
│    Action: [Pay] (untuk sisa)                              │
│    Info: "Sudah bayar Rp 5M, sisa Rp 5M"                  │
└─────────────────────────────────────────────────────────────┘
                        ↓ Receive Payment (Full: Rp 5M)
┌─────────────────────────────────────────────────────────────┐
│ 6. FULLY PAID ✅                                            │
│    status: PAID                                             │
│    approvalStatus: POSTED                                   │
│    paidTotal: Rp 10.000.000                                │
│    balanceDue: Rp 0                                        │
│    Ledger: JV-PAY-20260111-0002 (Created)                  │
│    Action: -                                                │
│    Info: "Lunas!"                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 **Database Updates**

### **After Post to Journal:**
```javascript
await tx.invoice.update({
  where: { id: invoice.id },
  data: {
    status: 'UNPAID',           // Payment status
    approvalStatus: 'POSTED'    // Posting status
  }
});
```

### **After Payment (Partial):**
```javascript
await tx.invoice.update({
  where: { id: invoiceId },
  data: {
    paidTotal: 5000000,
    balanceDue: 5000000,
    status: 'PARTIALLY_PAID',   // Payment status
    approvalStatus: 'POSTED'    // Tetap POSTED
  }
});
```

### **After Payment (Full):**
```javascript
await tx.invoice.update({
  where: { id: invoiceId },
  data: {
    paidTotal: 10000000,
    balanceDue: 0,
    status: 'PAID',             // Payment status
    approvalStatus: 'POSTED'    // Tetap POSTED
  }
});
```

---

## 🎨 **UI Display Examples**

### **Invoice List Table:**

| Invoice # | Customer | Amount | Payment Status | Posting Status | Balance | Action |
|-----------|----------|--------|----------------|----------------|---------|--------|
| INV-001 | PT ABC | 10M | 🟡 **UNPAID** | ✅ **POSTED** | 10M | **[Pay]** |
| INV-002 | PT XYZ | 20M | 🟠 **PARTIALLY PAID** | ✅ **POSTED** | 10M | **[Pay]** |
| INV-003 | PT DEF | 15M | 🟢 **PAID** | ✅ **POSTED** | 0 | - |
| INV-004 | PT GHI | 8M | ⚪ **DRAFT** | ⏳ **PENDING** | 8M | [Edit] |
| INV-005 | PT JKL | 12M | ⚪ **DRAFT** | ✅ **APPROVED** | 12M | **[Post]** |

### **Badge Component (React/TSX):**

```tsx
function InvoiceStatusBadges({ invoice }) {
  // Payment Status Badge
  const paymentBadge = {
    PAID: { 
      color: 'bg-green-100 text-green-800', 
      label: 'Lunas', 
      icon: '✅' 
    },
    PARTIALLY_PAID: { 
      color: 'bg-orange-100 text-orange-800', 
      label: 'Cicilan', 
      icon: '🟠' 
    },
    UNPAID: { 
      color: 'bg-yellow-100 text-yellow-800', 
      label: 'Belum Bayar', 
      icon: '🟡' 
    },
    OVERDUE: { 
      color: 'bg-red-100 text-red-800', 
      label: 'Telat', 
      icon: '🔴' 
    },
    DRAFT: { 
      color: 'bg-gray-100 text-gray-800', 
      label: 'Draft', 
      icon: '⚪' 
    }
  }[invoice.status];

  // Posting Status Badge
  const postingBadge = {
    POSTED: { 
      color: 'bg-green-100 text-green-800', 
      label: 'Posted', 
      icon: '✅' 
    },
    APPROVED: { 
      color: 'bg-blue-100 text-blue-800', 
      label: 'Approved', 
      icon: '👍' 
    },
    PENDING: { 
      color: 'bg-gray-100 text-gray-800', 
      label: 'Pending', 
      icon: '⏳' 
    },
    REJECTED: { 
      color: 'bg-red-100 text-red-800', 
      label: 'Rejected', 
      icon: '❌' 
    }
  }[invoice.approvalStatus];

  return (
    <div className="flex flex-col gap-1">
      {/* Payment Status */}
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${paymentBadge.color}`}>
        <span>{paymentBadge.icon}</span>
        <span>{paymentBadge.label}</span>
      </div>
      
      {/* Posting Status */}
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${postingBadge.color}`}>
        <span>{postingBadge.icon}</span>
        <span>{postingBadge.label}</span>
      </div>
      
      {/* Balance Due (if any) */}
      {invoice.balanceDue > 0 && (
        <div className="text-xs text-gray-600 mt-1">
          Sisa: <span className="font-semibold">{formatCurrency(invoice.balanceDue)}</span>
        </div>
      )}
    </div>
  );
}
```

---

## 🔍 **Filter & Search Logic**

### **Filter by Payment Status:**
```javascript
// Show only unpaid invoices
const unpaidInvoices = invoices.filter(inv => 
  inv.status === 'UNPAID' && inv.approvalStatus === 'POSTED'
);

// Show invoices needing payment
const needsPayment = invoices.filter(inv => 
  ['UNPAID', 'PARTIALLY_PAID'].includes(inv.status) && 
  inv.approvalStatus === 'POSTED'
);
```

### **Filter by Posting Status:**
```javascript
// Show invoices ready to post
const readyToPost = invoices.filter(inv => 
  inv.approvalStatus === 'APPROVED' && 
  inv.status === 'DRAFT'
);

// Show posted invoices
const postedInvoices = invoices.filter(inv => 
  inv.approvalStatus === 'POSTED'
);
```

---

## 📝 **Business Rules**

### **1. Post to Journal:**
- **Condition**: `approvalStatus === 'APPROVED'`
- **Action**: Create ledger JV-SI-xxx
- **Result**: 
  - `status` → `UNPAID`
  - `approvalStatus` → `POSTED`

### **2. Receive Payment:**
- **Condition**: `approvalStatus === 'POSTED'`
- **Action**: Create payment + ledger JV-PAY-xxx
- **Result**: 
  - If `balanceDue === 0`: `status` → `PAID`
  - If `balanceDue > 0`: `status` → `PARTIALLY_PAID`
  - `approvalStatus` → Tetap `POSTED`

### **3. Void Invoice:**
- **Condition**: `approvalStatus === 'POSTED'`
- **Action**: Create reversal ledger
- **Result**: 
  - `status` → `CANCELLED`
  - `approvalStatus` → `VOID`

---

## ✅ **Benefits**

### **For Users:**
- ✅ **Clear Information**: Langsung tahu status pembayaran DAN status posting
- ✅ **No Confusion**: "UNPAID" jelas = belum bayar, "POSTED" jelas = sudah di-posting
- ✅ **Better Tracking**: Bisa filter berdasarkan payment atau posting status

### **For Developers:**
- ✅ **Separation of Concerns**: Payment logic terpisah dari posting logic
- ✅ **Flexible Queries**: Bisa query berdasarkan payment atau posting
- ✅ **Standard ERP**: Sesuai best practice sistem akuntansi

### **For Accounting:**
- ✅ **Audit Trail**: Jelas kapan di-posting, kapan dibayar
- ✅ **Reconciliation**: Mudah cek invoice yang sudah di-posting tapi belum dibayar
- ✅ **Reporting**: Bisa generate report berdasarkan posting date atau payment date

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Full Payment**
1. Create invoice → `DRAFT` / `PENDING`
2. Approve → `DRAFT` / `APPROVED`
3. Post to Journal → `UNPAID` / `POSTED` ✅
4. Receive full payment → `PAID` / `POSTED` ✅

### **Scenario 2: Partial Payment**
1. Create invoice → `DRAFT` / `PENDING`
2. Approve → `DRAFT` / `APPROVED`
3. Post to Journal → `UNPAID` / `POSTED` ✅
4. Receive 50% payment → `PARTIALLY_PAID` / `POSTED` ✅
5. Receive 50% payment → `PAID` / `POSTED` ✅

### **Scenario 3: Rejected Invoice**
1. Create invoice → `DRAFT` / `PENDING`
2. Reject → `DRAFT` / `REJECTED` ❌
3. Cannot post or pay

---

**Created:** 11 Januari 2026  
**Version:** 2.0 (Final)  
**Status:** ✅ IMPLEMENTED
