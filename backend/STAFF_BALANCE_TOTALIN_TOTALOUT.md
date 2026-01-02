# Staff Balance - Implementasi totalIn dan totalOut

## Overview
Field `totalIn` dan `totalOut` telah ditambahkan ke model `StaffBalance` untuk tracking total dana yang diterima dan digunakan oleh karyawan.

## Schema (Prisma)

```prisma
model StaffBalance {
  id         String   @id @default(uuid())
  karyawanId String
  karyawan   Karyawan @relation(fields: [karyawanId], references: [id])

  category LedgerCategory // Membedakan saldo Operasional vs Pinjaman
  
  // Field Tambahan
  totalIn  Decimal @default(0) @db.Decimal(15, 2) // Total dana yang diterima/dicairkan
  totalOut Decimal @default(0) @db.Decimal(15, 2) // Total dana yang dilaporkan/dipakai
  amount   Decimal @default(0) @db.Decimal(15, 2) // Saldo berjalan (totalIn - totalOut)

  updatedAt DateTime @updatedAt

  @@unique([karyawanId, category])
}
```

## Logika Perhitungan

### 1. ✅ totalIn (SUDAH DIIMPLEMENTASIKAN)
**Kapan bertambah:**
- Saat Uang Muka (UM) dicairkan ke karyawan (status = DISBURSED)
- Hanya untuk UM yang **tidak terkait SPK** (spkId = null)
- Category: `OPERASIONAL_PROYEK`

**Implementasi:**
- File: `backend/src/controllers/um/umController.js`
- Fungsi: `createUangMuka()` dan `updateUangMukaStatus()`
- Logika:
  ```javascript
  const currentTotalIn = existingBalance ? Number(existingBalance.totalIn) : 0;
  const newTotalIn = currentTotalIn + Number(jumlah);
  
  await prismaTx.staffBalance.upsert({
    update: {
      amount: newBalance,
      totalIn: newTotalIn,
    },
    create: {
      amount: jumlah,
      totalIn: jumlah,
      totalOut: 0,
    },
  });
  ```

### 2. ⏳ totalOut (AKAN DIIMPLEMENTASIKAN NANTI)
**Kapan bertambah:**
- Saat Laporan Pertanggungjawaban (LPP) disetujui (status = APPROVED)
- Berdasarkan `totalBiaya` dari LPP
- Category: `OPERASIONAL_PROYEK`

**Rencana Implementasi:**
- File: `backend/src/controllers/lpp/lppController.js`
- Fungsi: `updateStatus()` - saat status berubah menjadi APPROVED
- Logika yang akan ditambahkan:
  ```javascript
  // Saat LPP disetujui
  if (status === 'APPROVED') {
    // 1. Ambil data uangMuka untuk mendapatkan karyawanId
    const uangMuka = await prismaTx.uangMuka.findUnique({
      where: { id: existingLpp.uangMukaId }
    });
    
    // 2. Update StaffBalance
    const existingBalance = await prismaTx.staffBalance.findUnique({
      where: {
        karyawanId_category: {
          karyawanId: uangMuka.karyawanId,
          category: 'OPERASIONAL_PROYEK',
        },
      },
    });
    
    const currentTotalOut = existingBalance ? Number(existingBalance.totalOut) : 0;
    const newTotalOut = currentTotalOut + Number(existingLpp.totalBiaya);
    const newBalance = Number(existingBalance.amount) - Number(existingLpp.totalBiaya);
    
    await prismaTx.staffBalance.update({
      where: {
        karyawanId_category: {
          karyawanId: uangMuka.karyawanId,
          category: 'OPERASIONAL_PROYEK',
        },
      },
      data: {
        amount: newBalance,
        totalOut: newTotalOut,
      },
    });
    
    // 3. Tambahkan record di StaffLedger
    await prismaTx.staffLedger.create({
      data: {
        karyawanId: uangMuka.karyawanId,
        tanggal: new Date(),
        keterangan: `Pertanggungjawaban ${existingLpp.nomor}`,
        debit: 0,
        kredit: existingLpp.totalBiaya, // Uang berkurang
        saldo: newBalance,
        category: 'OPERASIONAL_PROYEK',
        type: 'EXPENSE_REPORT',
        refId: existingLpp.id,
        createdBy: req.user?.id || 'SYSTEM',
      },
    });
  }
  ```

## Relasi dengan StaffLedger

Setiap perubahan pada `StaffBalance` harus disertai dengan pencatatan di `StaffLedger`:

| Transaksi | Debit | Kredit | Type | Category | Impact |
|-----------|-------|--------|------|----------|--------|
| Pencairan UM | jumlah | 0 | CASH_ADVANCE | OPERASIONAL_PROYEK | totalIn ↑, amount ↑ |
| Approval LPP | 0 | totalBiaya | EXPENSE_REPORT | OPERASIONAL_PROYEK | totalOut ↑, amount ↓ |

## Status Implementasi

- [x] Schema Prisma - Field `totalIn` dan `totalOut` sudah ada
- [x] Logic `totalIn` - Pencairan Uang Muka (createUangMuka)
- [x] Logic `totalIn` - Update Status Uang Muka (updateUangMukaStatus)
- [ ] Logic `totalOut` - Approval LPP (updateStatus) - **PENDING**
- [ ] Migration Database - Jika diperlukan untuk data existing

## Catatan Penting

1. **Konsistensi Data**: `amount` harus selalu sama dengan `totalIn - totalOut`
2. **Category Filtering**: Logika hanya berlaku untuk `OPERASIONAL_PROYEK`, bukan `PINJAMAN_PRIBADI`
3. **SPK Check**: Uang Muka yang terkait SPK tidak masuk ke StaffBalance (langsung ke proyek)
4. **Audit Trail**: Setiap perubahan balance harus tercatat di StaffLedger

## Testing Checklist

### totalIn
- [ ] Test pencairan UM baru (tanpa SPK)
- [ ] Test update status UM dari PENDING ke DISBURSED
- [ ] Test pencairan UM dengan SPK (tidak boleh update StaffBalance)
- [ ] Verify StaffLedger entry dibuat dengan benar

### totalOut (Nanti)
- [ ] Test approval LPP
- [ ] Test rejection LPP (tidak boleh update balance)
- [ ] Test multiple LPP untuk satu UM
- [ ] Verify saldo tidak negatif
- [ ] Verify StaffLedger entry dibuat dengan benar
