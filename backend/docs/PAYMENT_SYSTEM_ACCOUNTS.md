# System Account Mapping untuk Payment Processing

## Overview
Dokumen ini menjelaskan System Account Mapping yang digunakan untuk memproses pembayaran invoice (Full Payment dan Partial Payment).

## Konsep Akuntansi

### Skenario: Customer membayar Invoice
**Asumsi:**
- Invoice Amount: Rp 10.000.000
- Admin Fee (ditanggung perusahaan): Rp 10.000
- Metode: Bank Transfer ke BRI Cikarang

### Jurnal yang Terbentuk:

```
Tanggal: 11-01-2026
Ref: PAY-001 (Invoice #INV-001)
Deskripsi: Pembayaran dari PT ABC

Debit:  1-10002  Bank BRI KC. CIKARANG       Rp  9.990.000  (uang masuk net)
Debit:  6-10102  Beban Admin Bank            Rp     10.000  (biaya perusahaan)
Credit: 1-10101  Piutang Usaha               Rp 10.000.000  (piutang berkurang)
```

**Penjelasan:**
- Bank menerima Rp 9.990.000 (setelah dipotong admin Rp 10.000)
- Perusahaan mengakui beban admin Rp 10.000
- Piutang berkurang penuh Rp 10.000.000

## System Account Mappings

### 1. PAYMENT_RECEIVABLE_ACCOUNT
- **Key**: `PAYMENT_RECEIVABLE_ACCOUNT`
- **COA Code**: `1-10101`
- **COA Name**: Piutang Usaha
- **Account Type**: ASET
- **Normal Balance**: DEBIT
- **Fungsi**: Akun ini akan di-**KREDIT** (berkurang) saat pembayaran invoice diterima
- **Digunakan untuk**: Full Payment dan Partial Payment

**Contoh Penggunaan:**
```javascript
// Saat customer bayar invoice Rp 10.000.000
Credit: PAYMENT_RECEIVABLE_ACCOUNT  Rp 10.000.000
```

### 2. PAYMENT_BANK_CHARGE_EXPENSE
- **Key**: `PAYMENT_BANK_CHARGE_EXPENSE`
- **COA Code**: `6-10102`
- **COA Name**: Beban Admin Bank
- **Account Type**: BEBAN
- **Normal Balance**: DEBIT
- **Fungsi**: Mencatat biaya administrasi bank yang ditanggung perusahaan
- **Digunakan untuk**: Setiap kali ada admin fee dalam payment

**Contoh Penggunaan:**
```javascript
// Saat ada biaya admin Rp 10.000
Debit: PAYMENT_BANK_CHARGE_EXPENSE  Rp 10.000
```

## Perbedaan Full vs Partial Payment

### Full Payment
```
Invoice Amount: Rp 10.000.000
Payment Amount: Rp 10.000.000
Admin Fee: Rp 10.000

Jurnal:
Debit:  Bank (pilihan user)              Rp  9.990.000
Debit:  PAYMENT_BANK_CHARGE_EXPENSE      Rp     10.000
Credit: PAYMENT_RECEIVABLE_ACCOUNT       Rp 10.000.000

Result: Invoice status = PAID, Balance Due = 0
```

### Partial Payment (Cicilan 1 dari 2)
```
Invoice Amount: Rp 10.000.000
Payment Amount: Rp 5.000.000
Admin Fee: Rp 5.000

Jurnal:
Debit:  Bank (pilihan user)              Rp  4.995.000
Debit:  PAYMENT_BANK_CHARGE_EXPENSE      Rp      5.000
Credit: PAYMENT_RECEIVABLE_ACCOUNT       Rp  5.000.000

Result: Invoice status = PARTIALLY_PAID, Balance Due = 5.000.000
```

## Metode Pembayaran yang Didukung

Semua metode pembayaran akan masuk ke **Bank Account yang dipilih user**:
1. **TRANSFER** - Bank Transfer
2. **CASH** - Tunai (masuk ke Kas Peti Cash atau Bank pilihan)
3. **VA** - Virtual Account
4. **CHEQUE** - Cek/Giro
5. **CREDIT_CARD** - Kartu Kredit
6. **E_WALLET** - Digital Wallet (GoPay, OVO, dll)

**Catatan:** 
- Tidak ada mapping terpisah per metode
- Yang penting adalah **destination bank account** yang dipilih user
- Admin fee selalu dicatat di `PAYMENT_BANK_CHARGE_EXPENSE`

## Implementasi di Backend

### Cara Mengambil System Account
```javascript
import { prisma } from './config/db.js';

// Get Piutang Usaha account
const receivableAccount = await prisma.systemAccount.findUnique({
  where: { key: 'PAYMENT_RECEIVABLE_ACCOUNT' },
  include: { coa: true }
});

// Get Beban Admin Bank account
const bankChargeAccount = await prisma.systemAccount.findUnique({
  where: { key: 'PAYMENT_BANK_CHARGE_EXPENSE' },
  include: { coa: true }
});
```

### Contoh Pembuatan Jurnal
```javascript
async function createPaymentJournal(paymentData) {
  const { 
    amount,           // Rp 10.000.000
    adminFee,         // Rp 10.000
    bankAccountId,    // ID bank yang dipilih user
    invoiceId 
  } = paymentData;

  // 1. Get system accounts
  const receivableAcc = await getSystemAccount('PAYMENT_RECEIVABLE_ACCOUNT');
  const bankChargeAcc = await getSystemAccount('PAYMENT_BANK_CHARGE_EXPENSE');
  
  // 2. Get selected bank account
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
    include: { accountCOA: true }
  });

  const netAmount = amount - adminFee; // Rp 9.990.000

  // 3. Create journal entry
  const journal = await prisma.ledger.create({
    data: {
      date: new Date(),
      description: `Payment for Invoice #${invoiceNumber}`,
      reference: paymentReference,
      lines: {
        create: [
          // Debit: Bank (uang masuk)
          {
            accountId: bankAccount.accountCOA.id,
            debit: netAmount,
            credit: 0,
            description: 'Payment received'
          },
          // Debit: Beban Admin Bank
          {
            accountId: bankChargeAcc.coa.id,
            debit: adminFee,
            credit: 0,
            description: 'Bank admin fee'
          },
          // Credit: Piutang Usaha (piutang berkurang)
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

  return journal;
}
```

## Validasi

### Frontend Validation (sudah diimplementasi)
- Total Charged (Amount + Admin Fee) tidak boleh > Balance Due
- Jika Total Charged < Balance Due dan Payment Type = FULL:
  - Auto-switch ke PARTIAL
  - Show warning toast

### Backend Validation (perlu diimplementasi)
- Verify invoice exists dan status = POSTED
- Verify balance due > 0
- Verify amount + adminFee <= balanceDue
- Verify bank account exists dan active

## Testing Checklist

- [ ] Full Payment tanpa admin fee
- [ ] Full Payment dengan admin fee
- [ ] Partial Payment (cicilan 1)
- [ ] Partial Payment (cicilan terakhir)
- [ ] Payment dengan metode CASH
- [ ] Payment dengan metode TRANSFER
- [ ] Payment dengan metode VA
- [ ] Verify jurnal terbentuk dengan benar
- [ ] Verify saldo bank bertambah
- [ ] Verify piutang berkurang
- [ ] Verify beban admin tercatat

## Troubleshooting

### Error: "COA not found for PAYMENT_BANK_CHARGE_EXPENSE"
**Solusi:**
```bash
cd backend
node scripts/createBankChargeAccount.js
node scripts/seedSystemAccounts.js
```

### Error: "System account not found"
**Solusi:**
```bash
cd backend
node scripts/seedSystemAccounts.js
node scripts/checkPaymentAccounts.js
```

## Changelog

- **2026-01-11**: Initial creation
  - Added PAYMENT_RECEIVABLE_ACCOUNT mapping
  - Added PAYMENT_BANK_CHARGE_EXPENSE mapping
  - Created COA 6-10102 (Beban Admin Bank)

---

**Dibuat oleh:** AI Assistant  
**Tanggal:** 11 Januari 2026  
**Versi:** 1.0
