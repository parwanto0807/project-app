import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const TITLE = 'SOP Pengeluaran Barang (Material Requisition)'
const TARGET_ID = 'c4f51840-5cf6-4558-9d2d-dc687c78368d'

const MR_SOP = {
  type: 'SOP',
  version: 'FRM-SOP-INV-03',
  status: 'ACTIVE',
  content: 'Standar prosedur pengeluaran barang dari gudang proyek melalui Material Requisition (MR) pada menu Requisition di modul Inventory. Meliputi pembuatan MR dari PR yang disetujui atau dari PO, persetujuan MR, verifikasi ketersediaan stok, proses picking, pengeluaran barang dengan pemindaian QR Code (Scan & Issue) yang memotong stok gudang secara FIFO, posting jurnal untuk gudang WIP, hingga monitoring riwayat pengeluaran.',
  departments: ['OPS'],
  sections: [
    {
      title: 'Tujuan',
      order: 1,
      items: [
        'Menetapkan standar prosedur pengeluaran barang dari gudang proyek melalui Material Requisition (MR)',
        'Memastikan setiap pengeluaran barang tercatat dengan dokumen MR bernomor unik dan dapat ditelusuri',
        'Menjamin proses pengambilan barang (picking) dan penyerahan kepada peminta dilakukan secara terkendali menggunakan QR Code',
        'Memastikan saldo stok gudang terpotong secara akurat dengan metode FIFO saat barang dikeluarkan',
        'Menjamin biaya pemakaian material proyek dicatat ke jurnal akuntansi untuk gudang WIP'
      ]
    },
    {
      title: 'Ruang Lingkup',
      order: 2,
      items: [
        'Berlaku untuk seluruh transaksi pengeluaran barang yang dikelola pada menu Requisition (Admin Area > Inventory > Requisition)',
        'Mencakup pembuatan MR, persetujuan, verifikasi stok, picking, pengeluaran via QR (Scan & Issue), bulk issue, dan posting jurnal',
        'Menangani MR dari sumber internal (setelah Purchase Request disetujui) maupun MR yang dibuat otomatis dari Purchase Order',
        'Menangani MR hasil Auto-Generate dari Internal Stock Transfer antar gudang (notes AUTO-GENERATED-TRANSFER)'
      ]
    },
    {
      title: 'Definisi & Istilah',
      order: 3,
      items: [
        'Material Requisition (MR): dokumen permintaan dan pengeluaran barang dari gudang proyek',
        'Nomor MR: nomor dokumen berformat MR-YYYYMM-XXXX, contoh: MR-202608-0001',
        'QR Token: kode unik (cuid) yang melekat pada setiap MR dan ditampilkan sebagai QR Code untuk proses Scan & Issue',
        'PENDING: MR baru dibuat, menunggu persetujuan',
        'APPROVED: MR sudah disetujui',
        'READY_TO_PICKUP: MR sudah siap diambil/diproses picking',
        'ISSUED: MR sudah dikeluarkan, stok sudah terpotong',
        'CANCELLED: MR dibatalkan',
        'Picking: proses pengambilan fisik barang di gudang sesuai daftar item MR',
        'FIFO (First In First Out): metode pengambilan stok dari batch masuk pertama kali',
        'Stock Balance: saldo stok produk pada gudang dan periode tertentu',
        'Kartu Stok (Stock Detail): riwayat mutasi barang masuk (IN) dan keluar (OUT)',
        'Stock Allocation: pencatatan audit per batch yang diambil (audit trail)',
        'WIP Warehouse: gudang proyek yang memicu posting jurnal pemakaian material',
        'issuedById / issuedBy: karyawan yang melakukan pengeluaran barang'
      ]
    },
    {
      title: 'Kebijakan',
      order: 4,
      items: [
        'MR dibuat secara otomatis dari Purchase Request yang telah disetujui, dari Purchase Order, atau hasil Auto-Generate transfer antar gudang',
        'Nomor MR mengikuti format MR-YYYYMM-XXXX dan wajib unik',
        'Setiap MR memiliki QR Token unik yang menjadi kunci proses pengeluaran (Scan & Issue)',
        'MR hanya dapat dikeluarkan (ISSUED) satu kali; MR yang sudah ISSUED tidak dapat dikeluarkan ulang',
        'Pengeluaran barang wajib dilakukan oleh karyawan yang berwenang (issuedBy)',
        'Stok gudang dipotong secara FIFO dan dicatat sebagai Kartu Stok OUT dengan referensi nomor MR',
        'Jurnal pemakaian material hanya dapat diposting untuk gudang WIP dan hanya untuk MR berstatus ISSUED',
        'Satu MR tidak boleh diposting jurnal lebih dari satu kali (dicek terhadap nomor ledger)',
        'MR dengan sumber PO hanya dapat disetujui apabila Goods Receipt (GR) dari PO tersebut sudah selesai (COMPLETED)'
      ]
    },
    {
      title: 'Alur Status Dokumen MR',
      order: 5,
      items: [
        'PENDING (Menunggu Persetujuan): MR baru dibuat, termasuk MR Auto-Generate dari transfer antar gudang',
        'APPROVED (Disetujui): MR telah disetujui dan menunggu proses picking / kesiapan pengambilan',
        'READY_TO_PICKUP (Siap Diambil): MR dinyatakan siap untuk diambil/dikeluarkan dari gudang',
        'ISSUED (Sudah Dikeluarkan): MR diproses lewat Scan & Issue, stok terpotong, barang sudah diserahkan',
        'CANCELLED: MR dibatalkan sehingga tidak dapat diproses lebih lanjut'
      ]
    },
    {
      title: 'Prosedur Pembuatan Material Requisition (MR)',
      order: 6,
      items: [
        'Buka menu melalui sidebar: Admin Area > Inventory > Requisition',
        'MR dibuat otomatis oleh sistem setelah Purchase Request (PR) disetujui, berisi item dari PR terkait',
        'MR juga dapat dibuat otomatis dari Purchase Order pada halaman detail PO (flow Direct Issue), dengan sumber PO',
        'Sistem membuat Nomor MR otomatis sesuai format MR-YYYYMM-XXXX dan QR Token unik pada saat pembuatan',
        'Sistem mencatat data terkait: project, gudang tujuan, karyawan peminta (requestedBy), dan item beserta qty yang diminta',
        'Status awal MR adalah PENDING dan belum mempengaruhi stok gudang',
        'Catatan: MR dari Internal Stock Transfer dibuat otomatis dengan keterangan AUTO-GENERATED-TRANSFER [TF-...] saat transfer antar gudang diajukan'
      ]
    },
    {
      title: 'Prosedur Persetujuan (Approve) MR',
      order: 7,
      items: [
        'Pilih MR berstatus PENDING pada tabel Requisition',
        'Sebelum menyetujui, sistem memvalidasi kelengkapan: untuk MR bersumber PO, Goods Receipt (GR) dari PO tersebut wajib sudah berstatus COMPLETED terlebih dahulu',
        'Jika validasi gagal, sistem menampilkan pesan "Barang belum diterima. Silakan proses Goods Receipt terlebih dahulu."',
        'Lakukan persetujuan pada MR yang valid; status berubah menjadi APPROVED',
        'Setelah disetujui, lakukan verifikasi ketersediaan stok: sistem menampilkan stok saat ini dan jumlah kebutuhan (baseQtyRequired) setiap item beserta konversi satuannya',
        'Apabila seluruh stok tersedia, MR dapat diproses menuju kesiapan pengambilan (READY_TO_PICKUP)'
      ]
    },
    {
      title: 'Prosedur Picking & Kesiapan Pengambilan',
      order: 8,
      items: [
        'Pastikan MR sudah berstatus APPROVED atau READY_TO_PICKUP sebelum dilakukan picking',
        'Petugas gudang menyiapkan barang sesuai daftar item MR (produk, qty diminta, satuan)',
        'Perhatikan konversi satuan: jika diminta dalam usage unit, jumlah stok dihitung menggunakan faktor konversi ke satuan simpan (storage unit)',
        'Pastikan stok fisik mencukupi: sistem menampilkan indikator stok cukup/tidak cukup untuk setiap item',
        'Setelah barang siap, MR ditandai READY_TO_PICKUP (Siap Diambil)',
        'Untuk MR yang belum cukup stok, jangan paksakan pengeluaran; proses pengeluaran akan ditolak sistem apabila stok tidak mencukupi'
      ]
    },
    {
      title: 'Prosedur Pengeluaran Barang (Scan & Issue)',
      order: 9,
      items: [
        'Pada MR berstatus APPROVED / READY_TO_PICKUP, buka dialog konfirmasi pengeluaran',
        'Pilih metode input: pindai QR Code dengan kamera (tombol Scan) atau masukkan kode MR secara manual',
        'Pastikan identitas petugas pengeluaran (issuedBy) terisi dengan benar',
        'Klik konfirmasi Issue untuk memproses pengeluaran; sistem akan memvalidasi MR dan ketersediaan stok',
        'Untuk gudang WIP (isWip), sistem menampilkan peringatan khusus bahwa pengeluaran akan mempengaruhi jurnal pemakaian material',
        'Sistem memotong stok per item dengan metode FIFO dari batch fisik (Stock Detail) dan mencatat Stock Allocation sebagai audit trail',
        'Sistem membuat Kartu Stok OUT dengan referensi nomor MR dan memperbarui Stock Balance (stok keluar bertambah, stok akhir/tersedia berkurang, nilai persediaan menyesuaikan)',
        'Sistem memperbarui qtyIssued dan harga satuan (FIFO average) pada item MR',
        'Status MR berubah menjadi ISSUED, mencatat issuedById dan tanggal pengeluaran',
        'Apabila MR berasal dari Internal Stock Transfer, Stock Transfer terkait otomatis berubah status menjadi IN_TRANSIT'
      ]
    },
    {
      title: 'Dampak Stok & Pencatatan Kartu Stok',
      order: 10,
      items: [
        'Stock Balance produk pada gudang berkurang: Stock Out bertambah, Stok Akhir berkurang, Stock Tersedia (Available) berkurang, dan nilai persediaan (inventory value) menyesuaikan',
        'Booked Stock yang sebelumnya terbooking dari PR berkurang sesuai jumlah yang diambil',
        'Sistem membuat Kartu Stok tipe OUT dengan sumber PROJECT (atau TRANSFER untuk MR hasil transfer) dan referensi nomor MR',
        'Jumlah qtyIssued pada item MR diisi sama dengan qtyRequested dan harga satuan dicatat sesuai rata-rata FIFO',
        'Apabila terhubung ke Purchase Request Detail, jumlah terpenuhi (jumlahTerpenuhi) pada PR diperbarui otomatis',
        'Stock Allocation mencatat detail batch mana saja yang diambil sebagai jejak audit'
      ]
    },
    {
      title: 'Prosedur Posting Jurnal (Khusus Gudang WIP)',
      order: 11,
      items: [
        'Posting jurnal hanya diperbolehkan untuk MR berstatus ISSUED',
        'Posting jurnal hanya berlaku untuk gudang WIP (isWip = true)',
        'Buka opsi Posting pada MR yang sudah ISSUED dari gudang WIP',
        'Sistem menghitung total biaya material dari qtyIssued dikali harga satuan per item',
        'Apabila harga satuan belum terisi (0), sistem menghitung ulang dari Stock Allocation secara otomatis',
        'Sistem menolak posting apabila total biaya nol atau negatif',
        'Sistem menolak posting apabila jurnal untuk nomor MR tersebut sudah pernah dibuat (double posting)',
        'Jurnal mencatat pemakaian material proyek: debit akun Biaya Material Proyek (HPP / PURCHASE_EXPENSE) dan kredit akun persediaan pada gudang WIP (PROJECT_WIP)',
        'Jurnal memuat keterangan nomor MR, nama proyek, nomor PR terkait, dan mengaitkan project serta sales order bila tersedia'
      ]
    },
    {
      title: 'Prosedur Bulk Issue (Approve Semua)',
      order: 12,
      items: [
        'Tombol "Approve Semua (Bulk)" tersedia pada halaman Requisition untuk memproses seluruh MR berstatus PENDING sekaligus',
        'Klik tombol Bulk Approve dan konfirmasi identitas petugas pengeluaran (issuedById)',
        'Sistem memproses setiap MR satu per satu secara berurutan dari yang paling lama dibuat',
        'Untuk setiap MR, sistem menjalankan proses pengeluaran yang sama dengan Scan & Issue (potong stok FIFO, catat kartu stok, update status)',
        'Hasil ditampilkan dalam dialog: daftar MR yang berhasil (succeeded) dan yang gagal (failed) beserta alasan kegagalannya',
        'MR yang gagal (misal stok tidak mencukupi) tetap berstatus PENDING dan tidak mempengaruhi MR lainnya',
        'Daftar MR yang gagal dapat diunduh sebagai file CSV untuk ditindaklanjuti'
      ]
    },
    {
      title: 'Monitoring & Pengecekan MR',
      order: 13,
      items: [
        'Halaman Requisition menampilkan tabel MR dengan nomor MR, status, gudang, peminta, project, dan informasi ketersediaan stok',
        'Gunakan filter status, pencarian, dan pagination untuk menelusuri daftar MR',
        'Setiap MR menampilkan indikator ketersediaan stok per item (stok saat ini vs kebutuhan) untuk memudahkan verifikasi',
        'Klik ikon mata (View) untuk melihat detail MR: QR Code, status, project, gudang, peminta, daftar item, dan riwayat pengeluaran',
        'QR Code pada detail MR digunakan untuk proses Scan & Issue di gudang',
        'Riwayat pengeluaran menampilkan petugas yang menyiapkan (preparedBy) dan petugas yang mengeluarkan (issuedBy)'
      ]
    },
    {
      title: 'Penanganan Masalah',
      order: 14,
      items: [
        '"MR tidak valid atau sudah pernah dikeluarkan" => pastikan MR belum berstatus ISSUED dan QR Token yang dipindai sesuai',
        '"Stok tidak mencukupi" => verifikasi ketersediaan stok fisik dan Stock Balance; lakukan penerimaan barang (GR) terlebih dahulu',
        '"Stok untuk produk ... tidak ditemukan di gudang" => pastikan Stock Balance produk tersedia pada gudang dan periode yang dimaksud',
        'MR dari PO tidak dapat disetujui => proses Goods Receipt (GR) PO tersebut sampai berstatus COMPLETED terlebih dahulu',
        'Posting jurnal ditolak => pastikan MR sudah ISSUED, gudang adalah WIP, total biaya lebih dari nol, dan jurnal belum pernah dibuat',
        'Bulk issue sebagian gagal => unduh CSV daftar gagal, cek alasan (umumnya stok tidak mencukupi), penuhi stok lalu proses ulang',
        'MR hasil transfer tidak otomatis lanjut => pastikan MR dibuat dengan keterangan AUTO-GENERATED-TRANSFER yang benar saat transfer diajukan'
      ]
    },
    {
      title: 'Dokumen & Menu Terkait',
      order: 15,
      items: [
        'Logistic > Purchasing / Purchase Order (sumber pembuatan MR dan validaasi GR)',
        'Inventory > Goods Receipts (penerimaan barang, prasyarat persetujuan MR dari PO)',
        'Inventory > Stock Monitoring (pemantauan stok gudang setelah pengeluaran)',
        'Inventory > Kartu Stok (mutasi barang keluar)',
        'SOP Internal Transfer (Transfer Cepat Antar Gudang) untuk MR yang dibuat otomatis dari transfer antar gudang'
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
        type: MR_SOP.type,
        version: MR_SOP.version,
        status: MR_SOP.status,
        content: MR_SOP.content,
        createdById: admin.id,
        sections: {
          create: MR_SOP.sections.map(s => ({
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
          create: MR_SOP.departments.map(dCode => ({
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
      type: MR_SOP.type,
      version: MR_SOP.version,
      status: MR_SOP.status,
      content: MR_SOP.content
    }
  })

  await prisma.documentDepartment.deleteMany({ where: { documentId: existing.id } })
  for (const dCode of MR_SOP.departments) {
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
  for (const s of MR_SOP.sections) {
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
