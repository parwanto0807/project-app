# Implementasi Staff Balance & Ledger untuk Uang Muka

## Ringkasan Perubahan

Menambahkan logika otomatis untuk mencatat saldo dan transaksi karyawan di `StaffBalance` dan `StaffLedger` ketika uang muka dicairkan tanpa SPK.

## Kondisi Trigger

Logika ini akan dijalankan ketika:
1. **`spkId` = null/kosong** (tidak ada SPK terkait)
2. **Status `UangMuka` = `DISBURSED`** (sudah dicairkan)

## Model yang Terpengaruh

### 1. StaffBalance
Model untuk menyimpan saldo karyawan per kategori.

```prisma
model StaffBalance {
  id         String   @id @default(uuid())
  karyawanId String
  karyawan   Karyawan @relation(fields: [karyawanId], references: [id])

  category LedgerCategory // OPERASIONAL_PROYEK atau PINJAMAN_PRIBADI
  amount   Decimal        @default(0) @db.Decimal(15, 2)

  updatedAt DateTime @updatedAt

  @@unique([karyawanId, category])
}
```

### 2. StaffLedger
Model untuk mencatat setiap transaksi karyawan (buku besar).

```prisma
model StaffLedger {
  id         String   @id @default(uuid())
  karyawanId String
  karyawan   Karyawan @relation(fields: [karyawanId], references: [id])

  tanggal    DateTime @default(now())
  keterangan String   @db.Text

  debit  Decimal @default(0) @db.Decimal(15, 2) // Uang bertambah
  kredit Decimal @default(0) @db.Decimal(15, 2) // Uang berkurang
  saldo  Decimal @db.Decimal(15, 2) // Running balance

  category LedgerCategory
  type     TransactionStafBalanceType

  purchaseRequestId String?
  purchaseRequest   PurchaseRequest? @relation(fields: [purchaseRequestId], references: [id])

  refId     String? // ID dokumen referensi (UangMuka.id)
  createdBy String? // User yang melakukan input
}
```

## Implementasi

### 1. Fungsi `createUangMuka`

**File:** `backend/src/controllers/um/umController.js`

**Lokasi:** Dalam transaction block setelah create UangMuka

**Logika:**
```javascript
if (!spkId && status === UangMukaStatus.DISBURSED) {
  // 1. Cari saldo existing
  const existingBalance = await prismaTx.staffBalance.findUnique({
    where: {
      karyawanId_category: {
        karyawanId,
        category: "OPERASIONAL_PROYEK",
      },
    },
  });

  // 2. Hitung saldo baru
  const currentBalance = existingBalance ? Number(existingBalance.amount) : 0;
  const newBalance = currentBalance + Number(jumlah);

  // 3. Upsert StaffBalance
  await prismaTx.staffBalance.upsert({
    where: {
      karyawanId_category: {
        karyawanId,
        category: "OPERASIONAL_PROYEK",
      },
    },
    update: { amount: newBalance },
    create: {
      karyawanId,
      category: "OPERASIONAL_PROYEK",
      amount: jumlah,
    },
  });

  // 4. Create StaffLedger entry
  await prismaTx.staffLedger.create({
    data: {
      karyawanId,
      tanggal: tanggalPencairan || new Date(),
      keterangan: keterangan || `Pencairan uang muka ${nomor}`,
      debit: jumlah, // Uang bertambah bagi karyawan
      kredit: 0,
      saldo: newBalance,
      category: "OPERASIONAL_PROYEK",
      type: "CASH_ADVANCE",
      purchaseRequestId: purchaseRequestId || null,
      refId: uangMuka.id,
      createdBy: req.user?.id || "SYSTEM",
    },
  });
}
```

### 2. Fungsi `updateUangMukaStatus`

**File:** `backend/src/controllers/um/umController.js`

**Lokasi:** Dalam transaction block setelah update UangMuka

**Logika Tambahan:**
- Cek bahwa status sebelumnya **BUKAN** `DISBURSED` untuk menghindari duplikasi
- Gunakan data dari `existingUangMuka` karena sudah di-fetch sebelumnya

```javascript
if (
  !existingUangMuka.spkId &&
  status === UangMukaStatus.DISBURSED &&
  existingUangMuka.status !== UangMukaStatus.DISBURSED
) {
  // ... logika yang sama seperti createUangMuka
}
```

## Kategori dan Tipe Transaksi

### LedgerCategory
- **OPERASIONAL_PROYEK**: Uang untuk belanja material/lapangan
- **PINJAMAN_PRIBADI**: Hutang karyawan yang akan dipotong gaji

### TransactionStafBalanceType
- **CASH_ADVANCE**: Pemberian dana di awal (Kasbon) ← **Digunakan untuk Uang Muka**
- **EXPENSE_REPORT**: Pelaporan nota/kuitansi (Settlement)
- **LOAN_DISBURSEMENT**: Pencairan pinjaman pribadi
- **LOAN_REPAYMENT**: Pembayaran pinjaman
- **REIMBURSEMENT**: Penggantian uang pribadi karyawan

## Alur Transaksi

### Skenario 1: Create Uang Muka dengan spkId = null dan status = DISBURSED

```
1. User membuat Uang Muka baru
   - spkId: null
   - status: DISBURSED (langsung cair)
   - jumlah: Rp 5.000.000

2. System creates UangMuka record

3. System checks: spkId == null && status == DISBURSED ✓

4. System updates/creates StaffBalance:
   - category: OPERASIONAL_PROYEK
   - amount: currentBalance + 5.000.000

5. System creates StaffLedger entry:
   - debit: 5.000.000 (uang bertambah)
   - kredit: 0
   - saldo: newBalance
   - type: CASH_ADVANCE
   - refId: uangMuka.id
```

### Skenario 2: Update Status dari PENDING ke DISBURSED

```
1. Existing UangMuka:
   - spkId: null
   - status: PENDING
   - jumlah: Rp 3.000.000

2. User updates status to DISBURSED

3. System checks: 
   - spkId == null ✓
   - new status == DISBURSED ✓
   - old status != DISBURSED ✓

4. System updates/creates StaffBalance:
   - category: OPERASIONAL_PROYEK
   - amount: currentBalance + 3.000.000

5. System creates StaffLedger entry:
   - debit: 3.000.000
   - kredit: 0
   - saldo: newBalance
   - type: CASH_ADVANCE
   - refId: uangMuka.id
```

### Skenario 3: Create Uang Muka dengan spkId (tidak trigger)

```
1. User membuat Uang Muka baru
   - spkId: "abc-123" (ada SPK)
   - status: DISBURSED
   - jumlah: Rp 5.000.000

2. System creates UangMuka record

3. System checks: spkId == null ✗

4. NO StaffBalance/StaffLedger update
   (karena ada SPK, tracking dilakukan di level proyek)
```

## Keuntungan Implementasi

1. **Tracking Otomatis**: Saldo karyawan terupdate otomatis saat uang muka dicairkan
2. **Audit Trail**: Setiap transaksi tercatat di StaffLedger dengan referensi ke UangMuka
3. **Konsistensi Data**: Menggunakan transaction untuk memastikan atomicity
4. **Fleksibilitas**: Hanya berlaku untuk uang muka tanpa SPK (personal/non-project)
5. **Running Balance**: Saldo selalu akurat dengan perhitungan running balance

## Testing Checklist

- [ ] Create UangMuka dengan spkId=null dan status=DISBURSED
- [ ] Create UangMuka dengan spkId=null dan status=PENDING (tidak trigger)
- [ ] Create UangMuka dengan spkId dan status=DISBURSED (tidak trigger)
- [ ] Update status dari PENDING ke DISBURSED dengan spkId=null
- [ ] Update status dari DISBURSED ke DISBURSED lagi (tidak duplikasi)
- [ ] Verifikasi StaffBalance amount terupdate dengan benar
- [ ] Verifikasi StaffLedger entry tercatat dengan data lengkap
- [ ] Verifikasi running balance di StaffLedger akurat

## Catatan Penting

1. **Duplicate Prevention**: Logika di `updateUangMukaStatus` mengecek status lama untuk mencegah duplikasi entry
2. **Transaction Safety**: Semua operasi dilakukan dalam transaction untuk memastikan konsistensi
3. **Category**: Menggunakan `OPERASIONAL_PROYEK` karena uang muka tanpa SPK biasanya untuk operasional
4. **Reference ID**: `refId` di StaffLedger menyimpan `uangMuka.id` untuk traceability
5. **Created By**: Menggunakan `req.user?.id` jika tersedia, fallback ke "SYSTEM"

## File yang Dimodifikasi

- `backend/src/controllers/um/umController.js`
  - Fungsi `createUangMuka` (baris ~422-472)
  - Fungsi `updateUangMukaStatus` (baris ~744-799)
