# ✅ ANALISIS KELENGKAPAN SYSTEM ACCOUNTS UNTUK PAYMENT LEDGER

## Status: **SIAP DIGUNAKAN** ✅

Berdasarkan analisis file `seedSystemAccounts.js`, system accounts sudah **LENGKAP** untuk memproses payment ledger.

---

## 📋 Checklist Kelengkapan

### ✅ 1. Akun Piutang (Receivable)
- **Key**: `PAYMENT_RECEIVABLE_ACCOUNT`
- **COA**: `1-10101` (Piutang Usaha)
- **Status**: ✅ **TERSEDIA**
- **Fungsi**: Untuk mengurangi piutang saat payment diterima
- **Posisi Jurnal**: **CREDIT** (berkurang)

**Catatan**: Akun ini sama dengan `ACCOUNTS_RECEIVABLE` yang sudah ada sebelumnya. Ini adalah **best practice** karena:
- Saat invoice dibuat → Debit `ACCOUNTS_RECEIVABLE`
- Saat payment diterima → Credit `PAYMENT_RECEIVABLE_ACCOUNT`
- Keduanya mengarah ke akun yang sama (`1-10101`)

---

### ✅ 2. Akun Beban Admin Bank
- **Key**: `PAYMENT_BANK_CHARGE_EXPENSE`
- **COA**: `6-10102` (Beban Admin Bank)
- **Status**: ✅ **TERSEDIA**
- **Fungsi**: Untuk mencatat biaya admin bank yang ditanggung perusahaan
- **Posisi Jurnal**: **DEBIT** (bertambah)

---

### ✅ 3. Akun Bank/Kas (Destination Account)
System accounts menyediakan **6 bank accounts** + **1 petty cash**:

| Key | COA Code | Nama | Status |
|-----|----------|------|--------|
| `PETTY_CASH` | 1-10001 | Kas Peti Cash | ✅ |
| `BANK_BRI_CIKARANG` | 1-10002 | Bank BRI KC. CIKARANG | ✅ |
| `BANK_BRI_HARAPAN_INDAH` | 1-10003 | Bank BRI KC. HARAPAN INDAH | ✅ |
| `BANK_BRI_LEBAK_BULUS` | 1-10004 | Bank BRI KC. LEBAK BULUS | ✅ |
| `BANK_BRI_TAMBUN` | 1-10005 | Bank BRI KC. TAMBUN | ✅ |
| `BANK_BRI_KARAWANG` | 1-10006 | Bank BRI KC. BRI KARAWANG | ✅ |

**Catatan**: 
- Dalam praktik, bank account akan dipilih oleh user dari `BankAccount` table
- System accounts di atas hanya sebagai **fallback/default**
- Yang penting adalah `BankAccount.accountCOAId` sudah terisi dengan benar

---

## 🧾 Contoh Jurnal Payment yang Akan Terbentuk

### Skenario: Full Payment
```
Invoice: INV-001
Amount: Rp 10.000.000
Admin Fee: Rp 10.000
Bank: BRI Cikarang (dipilih user)
```

**Jurnal:**
```
Date: 2026-01-11
Ref: PAY-001
Description: Payment for Invoice INV-001

┌─────────────────────────────────────────────────────────┐
│ Account                    │ Debit       │ Credit       │
├────────────────────────────┼─────────────┼──────────────┤
│ 1-10002 Bank BRI Cikarang  │ 9.990.000   │              │ ← Uang masuk (net)
│ 6-10102 Beban Admin Bank   │    10.000   │              │ ← Biaya perusahaan
│ 1-10101 Piutang Usaha      │             │ 10.000.000   │ ← Piutang berkurang
├────────────────────────────┼─────────────┼──────────────┤
│ TOTAL                      │ 10.000.000  │ 10.000.000   │ ✅ BALANCED
└─────────────────────────────────────────────────────────┘
```

### Skenario: Partial Payment (Cicilan 1 dari 2)
```
Invoice: INV-002
Total Amount: Rp 20.000.000
Payment Amount: Rp 10.000.000 (50%)
Admin Fee: Rp 5.000
Bank: BRI Harapan Indah
```

**Jurnal:**
```
Date: 2026-01-11
Ref: PAY-002
Description: Partial Payment 1/2 for Invoice INV-002

┌─────────────────────────────────────────────────────────┐
│ Account                       │ Debit       │ Credit    │
├───────────────────────────────┼─────────────┼───────────┤
│ 1-10003 Bank BRI Harapan Indah│ 9.995.000   │           │
│ 6-10102 Beban Admin Bank      │     5.000   │           │
│ 1-10101 Piutang Usaha         │             │10.000.000 │
├───────────────────────────────┼─────────────┼───────────┤
│ TOTAL                         │ 10.000.000  │10.000.000 │ ✅
└─────────────────────────────────────────────────────────┘

Sisa Piutang: Rp 10.000.000 (masih tercatat di 1-10101)
```

---

## 🔍 Verifikasi System Accounts

Jalankan script verifikasi:
```bash
cd backend
node scripts/checkPaymentAccounts.js
```

**Expected Output:**
```
✓ Found Payment System Accounts:

Key: PAYMENT_RECEIVABLE_ACCOUNT
COA: 1-10101 - Piutang Usaha
Description: Digunakan untuk mencatat pengurangan piutang...
---

Key: PAYMENT_BANK_CHARGE_EXPENSE
COA: 6-10102 - Beban Admin Bank
Description: Digunakan untuk mencatat beban biaya administrasi bank...
---
```

---

## 🚀 Implementasi Backend (Next Steps)

### 1. Buat Helper Function untuk Get System Account
```javascript
// backend/src/utils/systemAccount.js

export async function getSystemAccount(key) {
  const account = await prisma.systemAccount.findUnique({
    where: { key },
    include: { coa: true }
  });
  
  if (!account) {
    throw new Error(`System account ${key} not found`);
  }
  
  return account;
}
```

### 2. Update Payment Action
```javascript
// backend/src/actions/invoice/payment.js

import { getSystemAccount } from '../../utils/systemAccount.js';

export async function processInvoicePayment(invoiceId, paymentData) {
  const { amount, adminFee, bankAccountId, method, reference } = paymentData;
  
  // 1. Get system accounts
  const receivableAcc = await getSystemAccount('PAYMENT_RECEIVABLE_ACCOUNT');
  const bankChargeAcc = await getSystemAccount('PAYMENT_BANK_CHARGE_EXPENSE');
  
  // 2. Get selected bank account
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
    include: { accountCOA: true }
  });
  
  if (!bankAccount || !bankAccount.accountCOA) {
    throw new Error('Bank account or its COA mapping not found');
  }
  
  const netAmount = amount - adminFee;
  
  // 3. Create ledger entry
  const ledger = await prisma.ledger.create({
    data: {
      date: new Date(),
      description: `Payment for Invoice #${invoice.invoiceNumber}`,
      reference: reference,
      source: 'INVOICE_PAYMENT',
      lines: {
        create: [
          // Debit: Bank (uang masuk)
          {
            accountId: bankAccount.accountCOA.id,
            debit: netAmount,
            credit: 0,
            description: `Payment received via ${method}`
          },
          // Debit: Beban Admin Bank (jika ada)
          ...(adminFee > 0 ? [{
            accountId: bankChargeAcc.coa.id,
            debit: adminFee,
            credit: 0,
            description: 'Bank admin fee'
          }] : []),
          // Credit: Piutang Usaha
          {
            accountId: receivableAcc.coa.id,
            debit: 0,
            credit: amount,
            description: 'Receivable reduction'
          }
        ]
      }
    }
  });
  
  // 4. Update invoice balance
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      balanceDue: { decrement: amount },
      status: newStatus // PAID or PARTIALLY_PAID
    }
  });
  
  // 5. Update bank balance
  await prisma.bankAccount.update({
    where: { id: bankAccountId },
    data: {
      currentBalance: { increment: netAmount }
    }
  });
  
  return { ledger, invoice };
}
```

---

## ⚠️ Catatan Penting

### 1. Admin Fee Logic
- **Frontend sudah handle**: Total Charged = Amount + Admin Fee
- **Backend harus validate**: Total tidak boleh > Balance Due
- **Jurnal**: Admin fee adalah **beban terpisah** (Debit), bukan pengurang amount

### 2. Bank Account Selection
- User memilih bank dari dropdown (data dari `BankAccount` table)
- Setiap `BankAccount` harus punya `accountCOAId` yang valid
- Jika `accountCOAId` null → error atau fallback ke default bank

### 3. Payment Method
- Semua method (TRANSFER, CASH, VA, CHEQUE, dll) menggunakan jurnal yang sama
- Yang berbeda hanya **destination bank account**
- Method hanya untuk **informasi/tracking**, tidak mempengaruhi jurnal

### 4. Partial Payment
- Tidak ada perbedaan jurnal dengan Full Payment
- Yang berbeda hanya:
  - **Amount** (lebih kecil dari balance due)
  - **Invoice status** (PARTIALLY_PAID vs PAID)
  - **Balance due** (masih ada sisa vs 0)

---

## ✅ Kesimpulan

**System accounts SUDAH SIAP untuk payment ledger processing!**

Yang perlu dilakukan selanjutnya:
1. ✅ System accounts → **DONE**
2. ✅ COA 6-10102 → **DONE**
3. ⏳ Backend payment action → **NEED IMPLEMENTATION**
4. ⏳ Testing & validation → **NEED TESTING**

**Rekomendasi:** Lanjut ke implementasi backend payment action menggunakan system accounts yang sudah tersedia.

---

**Dibuat:** 11 Januari 2026  
**Status:** READY FOR IMPLEMENTATION ✅
