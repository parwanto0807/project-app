import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const TITLE = 'SOP Penerimaan Barang (Goods Receipt)'
const TARGET_ID = '4242269e-bd4c-4769-8b16-68ec09213609'

const GR_SOP = {
  type: 'SOP',
  version: 'FRM-SOP-INV-02',
  status: 'ACTIVE',
  content: 'Standar prosedur penerimaan barang dari vendor berdasarkan Purchase Order (PO) yang disetujui melalui menu Goods Receipts. Meliputi pembuatan GR, penerimaan barang (Terima), pemeriksaan kualitas (QC Check), persetujuan (Approve) yang mengupdate stok gudang, hingga monitoring riwayat.',
  departments: ['OPS'],
  sections: [
    {
      title: 'Tujuan',
      order: 1,
      items: [
        'Menetapkan standar prosedur penerimaan barang dari vendor/supplier berdasarkan Purchase Order (PO) yang sudah disetujui',
        'Memastikan jumlah barang yang diterima tercatat benar sesuai Surat Jalan (SJ) dan PO',
        'Menjamin setiap barang melalui pemeriksaan kualitas (Quality Control/QC) sebelum masuk ke stok gudang',
        'Memastikan saldo stok gudang hanya terupdate setelah Goods Receipt (GR) disetujui (Approve)'
      ]
    },
    {
      title: 'Ruang Lingkup',
      order: 2,
      items: [
        'Berlaku untuk seluruh transaksi penerimaan barang yang dikelola pada menu Goods Receipts di modul Inventory',
        'Mencakup pembuatan GR dari PO, penerimaan barang (Mark as Arrived), pemeriksaan QC, persetujuan (Approve), dan monitoring',
        'Juga menangani GR yang berasal dari Stock Transfer antar gudang (source TRANSFER)'
      ]
    },
    {
      title: 'Definisi & Istilah',
      order: 3,
      items: [
        'Goods Receipt (GR): dokumen penerimaan barang yang mencatat barang masuk ke gudang',
        'Nomor GR: nomor dokumen berformat GRN-YYYYMM-XXXX, contoh: GRN-202608-0001',
        'Purchase Order (PO): dokumen pemesanan barang ke vendor yang sudah berstatus APPROVED',
        'Surat Jalan (Delivery Note): dokumen pengiriman barang dari vendor',
        'DRAFT: status GR menunggu kedatangan barang',
        'ARRIVED: barang sudah diterima secara fisik',
        'PASSED: hasil QC lolos dan menunggu approval',
        'COMPLETED: GR selesai dan stok gudang sudah terupdate',
        'CANCELLED: GR dibatalkan',
        'QC (Quality Control): pemeriksaan kualitas barang sebelum masuk stok',
        'Passed / Rejected / Partial: hasil pemeriksaan QC per item',
        'Stock Balance: saldo stok produk pada gudang dan periode tertentu',
        'Kartu Stok (Stock Detail): riwayat mutasi barang masuk (IN) dan keluar (OUT)',
        'onPR: stok yang sedang dipesan melalui PR/PO dan akan berkurang saat GR di-approve'
      ]
    },
    {
      title: 'Kebijakan',
      order: 4,
      items: [
        'GR hanya dapat dibuat berdasarkan Purchase Order berstatus APPROVED',
        'Nomor GR mengikuti format GRN-YYYYMM-XXXX dan wajib unik',
        'Nomor Surat Jalan (Vendor Delivery Note) wajib diisi',
        'Untuk setiap item, jumlah qtyPassed + qtyRejected harus sama dengan qtyReceived',
        'Stok gudang baru bertambah setelah GR disetujui (Approve), bukan saat GR dibuat',
        'GR yang sudah di-approve (COMPLETED) tidak dapat diubah atau dibatalkan',
        'Penghapusan GR hanya dapat dilakukan pada status DRAFT oleh pengguna dengan role admin',
        'Untuk gudang WIP (Proyek), laporan nota lapangan harus diverifikasi terlebih dahulu sebelum penerimaan',
        'Seluruh item wajib menyelesaikan QC sebelum GR dapat di-approve'
      ]
    },
    {
      title: 'Alur Status Dokumen GR',
      order: 5,
      items: [
        'DRAFT (Menunggu Kedatangan Barang): GR baru yang dibuat dari PO',
        'ARRIVED (Barang Sudah Diterima): klik "Terima Barang" untuk mencatat barang datang',
        'PASSED (QC Passed - Menunggu Approval): setelah QC Check selesai dilakukan',
        'COMPLETED (Selesai): klik "Approve GR" dan stok gudang otomatis terupdate',
        'CANCELLED: GR dibatalkan (khusus yang masih berstatus DRAFT)'
      ]
    },
    {
      title: 'Prosedur Pembuatan Goods Receipt (GR)',
      order: 6,
      items: [
        'Buka menu melalui sidebar: Admin Area > Inventory > Goods Receipts',
        'Klik tombol buat GR (Create Goods Receipt) atau pilih Purchase Order yang akan diterima',
        'Isi Nomor GR atau klik tombol "Generate" agar sistem membuat nomor otomatis sesuai format GRN-YYYYMM-XXXX',
        'Pilih Tanggal Diterima (default hari ini, tidak boleh tanggal masa depan)',
        'Isi Nomor Surat Jalan (wajib) sesuai SJ dari vendor',
        'Isi Nomor Kendaraan dan Nama Supir (opsional)',
        'Pilih Purchase Order (wajib) - hanya PO berstatus APPROVED yang tampil; item PO otomatis dimuat ke daftar barang',
        'Pilih Gudang tujuan penerimaan (wajib)',
        'Pilih Penerima / Received By (wajib)',
        'Periksa setiap item: produk, jumlah diterima, satuan, jumlah lolos (passed), jumlah ditolak (rejected), status QC, dan catatan QC',
        'Tambahkan atau hapus item bila diperlukan, dan pastikan qtyPassed + qtyRejected = qtyReceived untuk setiap item',
        'Isi Catatan (opsional)',
        'Klik "Create Goods Receipt" - GR tersimpan dengan status DRAFT dan belum mempengaruhi stok'
      ]
    },
    {
      title: 'Prosedur Penerimaan Barang (Terima Barang)',
      order: 7,
      items: [
        'Pada GR berstatus DRAFT, klik tombol "Terima Barang"',
        'Pilih Tanggal Diterima (default tanggal hari ini)',
        'Lengkapi Nomor Surat Jalan, Nomor Kendaraan, dan Nama Supir',
        'Pilih Mode Penerimaan: "Terima Semua" (otomatis terisi sesuai rencana PO) atau "Terima Partial" (input manual per item)',
        'Input Qty Diterima untuk setiap item; minimal satu item harus memiliki jumlah lebih dari 0',
        'Klik "Konfirmasi Penerimaan"',
        'Status GR berubah menjadi ARRIVED; setiap item berstatus RECEIVED (atau PARTIAL bila jumlah yang diterima kurang dari rencana)',
        'Lanjutkan ke proses QC Check',
        'Catatan: untuk gudang WIP, pastikan nota/laporan lapangan sudah dicek; untuk GR dari transfer, transfer harus berstatus IN_TRANSIT'
      ]
    },
    {
      title: 'Prosedur Pemeriksaan Kualitas (QC Check)',
      order: 8,
      items: [
        'Pada GR berstatus ARRIVED, klik tombol "QC Check"',
        'Gunakan tombol "Semua Item OK (Pass All)" untuk meloloskan seluruh item sekaligus, atau input manual per item',
        'Isi Qty Lolos (Passed) dan Qty Ditolak (Rejected); jumlah keduanya harus sama dengan Qty Diterima',
        'Isi Catatan QC, terutama jika terdapat barang yang ditolak (reject)',
        'Klik "Simpan Hasil QC"',
        'Status GR berubah menjadi PASSED; setiap item berstatus PASSED, REJECTED, atau PARTIAL',
        'Lanjutkan ke proses Approve GR untuk mengupdate stok'
      ]
    },
    {
      title: 'Prosedur Persetujuan (Approve) & Dampak Stok',
      order: 9,
      items: [
        'Pada GR berstatus PASSED, klik tombol "Approve GR"',
        'Periksa ringkasan hasil QC: jumlah item passed, partial, rejected, dan total qty yang masuk stock',
        'Isi Catatan (opsional) pada dialog approval',
        'Klik "Approve & Update Stock"',
        'Sistem membuat Kartu Stok tipe IN dengan referensi nomor GR',
        'Stock Balance gudang bertambah: Stock In, Stok Akhir, dan Stok Tersedia (Available) naik, nilai persediaan (inventory value) bertambah',
        'Jumlah yang masuk stok = qty passed (dengan konversi satuan ke satuan simpan/storage unit)',
        'Untuk GR non-transfer, stok onPR berkurang sebesar jumlah yang diterima',
        'Status GR menjadi COMPLETED dan tidak dapat diubah lagi',
        'Apabila masih ada sisa jumlah yang belum diterima, sistem dapat membuat GR baru secara otomatis (Auto GR)'
      ]
    },
    {
      title: 'Monitoring & Pengecekan GR',
      order: 10,
      items: [
        'Halaman Goods Receipts menampilkan kartu statistik: Total GRs, Total Received, Passing Rate, dan Draft',
        'Tabel GR menampilkan: Nomor GR, Tanggal Dibuat, Estimasi/Tanggal Diterima, Surat Jalan, Vendor, Gudang, dan Status',
        'Gunakan filter dan kotak pencarian untuk menyaring berdasarkan status, gudang, tanggal, atau kata kunci',
        'Gunakan pagination untuk menelusuri daftar GR yang panjang',
        'Klik ikon mata (View) untuk melihat detail GR: status, tanggal dibuat/diterima/estimasi, supplier, gudang, info pengiriman, dan tabel item (planned, diterima, passed, rejected, status QC)',
        'Cetak GRN (PDF) tersedia untuk GR berstatus PASSED',
        'GR berstatus DRAFT dapat dihapus oleh admin'
      ]
    },
    {
      title: 'Penanganan Masalah',
      order: 11,
      items: [
        '"Format harus GRN-YYYYMM-XXXX" => gunakan tombol Generate atau tulis nomor sesuai format tersebut',
        'PO tidak muncul pada dropdown => pastikan PO sudah berstatus APPROVED',
        '"qtyPassed + qtyRejected harus sama qtyReceived" => sesuaikan jumlah lolos dan ditolak agar totalnya sama dengan jumlah diterima',
        'Tombol "Terima Barang" tidak aktif => pastikan GR masih DRAFT; untuk gudang WIP cek verifikasi nota lapangan; untuk transfer cek status IN_TRANSIT',
        'Tombol "QC Check" tidak muncul => pastikan seluruh item sudah berstatus ARRIVED',
        'Tombol "Approve GR" tidak aktif => pastikan seluruh item sudah selesai QC (bukan PENDING atau ARRIVED)',
      ]
    },
    {
      title: 'Dokumen & Menu Terkait',
      order: 12,
      items: [
        'Logistic > Purchasing (pembuatan Purchase Order)',
        'Inventory > Stock Monitoring (pemantauan stok gudang)',
        'Inventory > Kartu Stok (mutasi barang masuk)',
        'SOP Internal Transfer (Transfer Cepat Antar Gudang) untuk GR yang berasal dari transfer antar gudang'
      ]
    }
  ]
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin', active: true }
  })

  if (!admin) {
    console.error('No admin user found to associate as creator')
    return
  }

  // Find existing document by id or title
  let existing = await prisma.document.findUnique({ where: { id: TARGET_ID } })
  if (!existing) {
    existing = await prisma.document.findFirst({ where: { title: TITLE } })
  }

  if (!existing) {
    console.log('Document not found, creating new...')
    const doc = await prisma.document.create({
      data: {
        title: TITLE,
        type: GR_SOP.type,
        version: GR_SOP.version,
        status: GR_SOP.status,
        content: GR_SOP.content,
        createdById: admin.id,
        sections: {
          create: GR_SOP.sections.map(s => ({
            title: s.title,
            orderIndex: s.order,
            items: {
              create: s.items.map((it, idx) => ({
                content: it,
                orderIndex: idx + 1
              }))
            }
          }))
        },
        departments: {
          create: GR_SOP.departments.map(dCode => ({
            department: { connect: { code: dCode } },
            isPrimary: true
          }))
        }
      }
    })
    console.log(`Created SOP: ${doc.title} (${doc.id})`)
    return
  }

  // Update existing document (delete & recreate nested data)
  const updated = await prisma.document.update({
    where: { id: existing.id },
    data: {
      title: TITLE,
      type: GR_SOP.type,
      version: GR_SOP.version,
      status: GR_SOP.status,
      content: GR_SOP.content
    }
  })

  await prisma.documentDepartment.deleteMany({ where: { documentId: existing.id } })
  for (const dCode of GR_SOP.departments) {
    await prisma.documentDepartment.create({
      data: {
        document: { connect: { id: existing.id } },
        department: {
          connectOrCreate: {
            where: { code: dCode },
            create: { code: dCode, name: dCode }
          }
        },
        isPrimary: true
      }
    })
  }

  await prisma.documentSection.deleteMany({ where: { documentId: existing.id } })
  for (const s of GR_SOP.sections) {
    await prisma.documentSection.create({
      data: {
        document: { connect: { id: existing.id } },
        title: s.title,
        orderIndex: s.order,
        items: {
          create: s.items.map((it, idx) => ({
            content: it,
            orderIndex: idx + 1
          }))
        }
      }
    })
  }

  console.log(`Updated SOP: ${updated.title} (${updated.id})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
