import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const TITLE = 'SOP Pengelolaan Purchase Request (PR)'
const TARGET_ID = '6a5e7c19-47a4-421f-ae27-bdf92d8447be'

const PR_SOP = {
  type: 'SOP',
  version: 'FRM-SOP-PR-001',
  status: 'ACTIVE',
  content: 'Standar prosedur pengajuan dan pengelolaan Purchase Request (PR) pada modul Logistik, mencakup pembuatan PR Umum maupun PR SPK (Project), verifikasi pada menu PR Verify, otomatisasi pembuatan Purchase Order (PO), alokasi gudang, monitoring sisa budget, serta pembuatan Laporan Pengeluaran Perjalanan (LPP) sebagai bentuk pertanggungjawaban atas Uang Muka. Prosedur ini terintegrasi antara menu PR, PR Verify, Purchasing, dan LPP pada sistem ERP.',
  departments: ['PURCHASING'],
  sections: [
    {
      title: 'Tujuan',
      order: 1,
      items: [
        'Menetapkan standar prosedur pengajuan Purchase Request (PR) yang seragam bagi seluruh karyawan',
        'Memisahkan secara jelas alur PR Umum (tanpa SPK) dan PR SPK/Project (berbasis Surat Perintah Kerja)',
        'Memastikan setiap pengajuan pembelian memiliki dokumen, klasifikasi, dan nomor PR yang sesuai',
        'Menjamin verifikasi pengajuan dilakukan sebelum pembelian dilaksanakan melalui menu PR Verify',
        'Mengotomatiskan pembuatan Purchase Order (PO) dari PR yang telah disetujui agar proses pembelian efektif',
        'Menjaga kontrol anggaran melalui sisa budget pada PR parent (PR Umum)'
      ]
    },
    {
      title: 'Ruang Lingkup',
      order: 2,
      items: [
        'Berlaku untuk seluruh pengajuan pembelian barang dan jasa melalui modul Logistik',
        'Mencakup PR Umum yang memenuhi kebutuhan stok gudang atau operasional tanpa referensi SPK',
        'Mencakup PR SPK/Project yang memenuhi kebutuhan material dan jasa proyek berdasarkan SPK',
        'Mencakup proses pembuatan, verifikasi, otomatisasi PO, alokasi gudang, dan monitoring sisa budget',
        'Mencakup pembuatan Laporan Pengeluaran Perjalanan (LPP) sebagai pertanggungjawaban Uang Muka dari PR',
        'Seluruh proses dijalankan pada menu PR, PR Verify, Purchasing, dan LPP pada sistem ERP'
      ]
    },
    {
      title: 'Definisi & Istilah',
      order: 3,
      items: [
        'Purchase Request (PR): dokumen permintaan pembelian barang/jasa yang diajukan oleh karyawan',
        'PR Umum: PR untuk kebutuhan stok gudang atau operasional kantor tanpa referensi SPK',
        'PR SPK / PR Project: PR untuk kebutuhan material/jasa proyek yang mengacu pada Surat Perintah Kerja (SPK)',
        'Parent PR: PR Umum yang telah berstatus APPROVED dan menjadi acuan anggaran bagi PR SPK',
        'SPK (Surat Perintah Kerja): dokumen penugasan pengerjaan proyek yang menjadi referensi PR SPK',
        'Source Product: asal pemenuhan barang, yaitu PENGAMBILAN_STOK (dari gudang sendiri) atau PEMBELIAN_BARANG (dari supplier luar)',
        'Material Requisition (MR): dokumen pengeluaran barang dari gudang yang dihasilkan dari PR dengan source PENGAMBILAN_STOK',
        'Purchase Order (PO): dokumen pemesanan barang/jasa kepada supplier yang dihasilkan dari PR dengan source PEMBELIAN_BARANG',
        'Sisa Budget: sisa anggaran PR parent yang tersedia setelah dikurangi total estimasi PR child',
        'Uang Muka (UM): pencairan dana awal kepada karyawan sebelum pelaksanaan kegiatan berdasarkan PR dengan item OPERATIONAL',
        'Laporan Pengeluaran Perjalanan (LPP): laporan pertanggungjawaban atas Uang Muka yang memuat rincian pengeluaran beserta bukti transaksi',
        'Pertanggungjawaban: model data LPP pada sistem yang terhubung dengan Uang Muka dan Purchase Request',
        'Rincian LPP: detail pengeluaran pada LPP berisi tanggal transaksi, keterangan, jumlah, nomor bukti, dan jenis pembayaran',
        'Foto Bukti: dokumen digital bukti transaksi (struk/bon/kwitansi) yang dilampirkan pada rincian LPP',
        'Sisa Uang Dikembalikan: selisih antara total Uang Muka dengan total biaya realisasi pada LPP'
      ]
    },
    {
      title: 'Kebijakan',
      order: 4,
      items: [
        'Setiap pengajuan pembelian barang/jasa wajib dibuat melalui Purchase Request (PR) pada sistem ERP',
        'PR diklasifikasikan menjadi dua tipe: PR Umum (tanpa SPK) dan PR SPK/Project (mengacu pada SPK)',
        'PR SPK wajib memiliki Parent PR berupa PR Umum yang telah berstatus APPROVED',
        'PR Umum tidak diperkenankan memiliki Parent PR',
        'Total estimasi budget PR SPK tidak boleh melebihi sisa budget pada Parent PR',
        'Setiap PR wajib melewati verifikasi pada menu PR Verify sebelum dapat diproses menjadi PO/MR',
        'Estimasi harga wajib diisi, atau dapat diisi 0 dan harga final dilengkapi pada proses Purchase Order',
        'Hanya PR berstatus DRAFT atau REVISION_NEEDED yang dapat dihapus',
        'Setiap pencairan Uang Muka wajib dipertanggungjawabkan melalui Laporan Pengeluaran Perjalanan (LPP)',
        'LPP hanya dapat dibuat dari PR berstatus COMPLETED yang memiliki Uang Muka',
        'Seluruh pengeluaran dalam LPP wajib disertai rincian yang valid dan foto bukti transaksi'
      ]
    },
    {
      title: 'Klasifikasi Purchase Request (PR)',
      order: 5,
      items: [
        'PR Umum: digunakan untuk kebutuhan stok gudang atau operasional kantor tanpa referensi SPK',
        'PR SPK/Project: digunakan untuk kebutuhan material/jasa proyek yang mengacu pada SPK tertentu',
        'PR SPK wajib menautkan Parent PR (PR Umum yang sudah APPROVED) sebagai pengendali anggaran',
        'Nomor PR dibedakan berdasarkan tipe: PR-UM-RYLIF untuk PR Umum dan PR-SPK-RYLIF untuk PR SPK',
        'Format nomor PR: NNNNN/PR-[UM|SPK]-RYLIF/BULANROM/TAHUN (contoh: 00001/PR-UM-RYLIF/X/26)',
        'Halaman PR menyediakan tab filter: Semua (all), Umum (umum), dan Project (project) untuk memudahkan pemantauan'
      ]
    },
    {
      title: 'Prosedur Pengajuan PR Umum',
      order: 6,
      items: [
        'Buka menu melalui sidebar: Admin Area > Logistik > PR',
        'Klik tombol Buat PR Baru dan pilih klasifikasi PR Umum (tanpa SPK)',
        'Isi data pengajuan: tanggal PR, karyawan pengaju, proyek bila diperlukan, dan keperluan pembelian',
        'Tentukan Source Product untuk setiap item: PENGAMBILAN_STOK (dari gudang) atau PEMBELIAN_BARANG (dari supplier)',
        'Lengkapi detail item: produk, jumlah, satuan, sumber anggaran (project budget), dan estimasi harga satuan',
        'Estimasi total harga dihitung otomatis oleh sistem dari jumlah dikali estimasi harga satuan',
        'Apabila harga belum diketahui, estimasi harga dapat diisi 0 dan harga final dilengkapi pada modul Purchase Order',
        'Simpan PR sebagai DRAFT, kemudian ajukan (submit) agar berstatus SUBMITTED dan masuk antrian verifikasi'
      ]
    },
    {
      title: 'Prosedur Pengajuan PR SPK / Project',
      order: 7,
      items: [
        'Buka menu PR dan pilih klasifikasi PR SPK/Project pada form pembuatan PR',
        'Pilih SPK yang menjadi referensi pengajuan; sistem akan menandai PR sebagai hasSPK',
        'Wajib memilih Parent PR berupa PR Umum yang telah berstatus APPROVED',
        'Sistem memvalidasi ketersediaan sisa budget pada Parent PR; pengajuan ditolak apabila melebihi sisa budget',
        'Lengkapi detail item dengan produk, jumlah, satuan, project budget, dan estimasi harga',
        'Sisa budget Parent PR otomatis diperbarui ketika PR SPK dibuat atau berubah status',
        'PR SPK yang disetujui dengan source PENGAMBILAN_STOK akan menghasilkan alokasi gudang dan Material Requisition (MR)'
      ]
    },
    {
      title: 'Prosedur Verifikasi (PR Verify)',
      order: 8,
      items: [
        'Buka menu melalui sidebar: Admin Area > Logistik > PR Verify',
        'Sistem menampilkan daftar PR berstatus SUBMITTED sebagai prioritas verifikasi',
        'Periksa kelengkapan dokumen, kebenaran data item, estimasi harga, dan kesesuaian sumber anggaran',
        'Untuk PR Umum: pastikan tidak memiliki Parent PR dan klasifikasi sumber item tepat',
        'Untuk PR SPK: pastikan Parent PR berstatus APPROVED, SPK terisi, dan sisa budget mencukupi',
        'Untuk source PENGAMBILAN_STOK: isi alokasi gudang pada tiap item sesuai gudang tujuan',
        'Setujui PR menjadi APPROVED, kembalikan menjadi REVISION_NEEDED untuk perbaikan, atau tolak menjadi REJECTED',
        'Sertakan catatan (catatan) pada setiap keputusan untuk keperluan audit dan klarifikasi pengaju'
      ]
    },
    {
      title: 'Otomatisasi Purchase Order (PO)',
      order: 9,
      items: [
        'PR yang berstatus APPROVED dan mengandung item source PEMBELIAN_BARANG akan otomatis membuat PO berstatus DRAFT',
        'PO dibuat otomatis oleh sistem melalui fungsi createPOFromApprovedPR pada proses persetujuan PR',
        'Supplier pada PO awal menggunakan supplier aktif pertama sebagai placeholder dan wajib diperbarui oleh Tim Purchasing',
        'Gudang PO ditentukan dari alokasi gudang item atau gudang aktif pertama',
        'Harga dan kuantitas PO mengikuti estimasi PR, dan dapat disesuaikan oleh Tim Purchasing',
        'Item ber source PENGAMBILAN_STOK tidak membuat PO, melainkan diproses melalui alokasi gudang dan MR',
        'Tim Purchasing menerima notifikasi dan melengkapi supplier serta harga final pada PO yang terbentuk otomatis'
      ]
    },
    {
      title: 'Alokasi Gudang & Material Requisition (MR)',
      order: 10,
      items: [
        'Item PR dengan source PENGAMBILAN_STOK wajib memiliki alokasi gudang pada proses verifikasi',
        'Alokasi gudang mencatat gudang tujuan dan jumlah barang untuk setiap item',
        'PR SPK yang disetujui dengan item PENGAMBILAN_STOK akan diproses menjadi Material Requisition (MR)',
        'MR digunakan untuk pengeluaran barang dari gudang proyek sesuai alokasi yang telah disetujui',
        'Pastikan stok gudang tujuan mencukupi sebelum barang dikeluarkan',
        'Penerimaan dan pengeluaran barang hasil MR dicatat pada modul Inventory agar stok tetap akurat'
      ]
    },
    {
      title: 'Prosedur Pembuatan LPP (Laporan Pengeluaran Perjalanan)',
      order: 11,
      items: [
        'LPP hanya dapat dibuat dari PR berstatus COMPLETED yang memiliki Uang Muka (source item OPERATIONAL)',
        'Buka menu melalui sidebar: Admin Area > Logistik > LPP, atau klik tombol Create LPP pada detail PR',
        'Pilih PR tujuan sehingga sistem memuat data Uang Muka, total pengajuan, dan rincian item OPERATIONAL',
        'Gunakan fitur tarik data (pull) untuk mengisi rincian pengeluaran otomatis dari rincian PR atau Purchase Receipt pada PO terkait',
        'Sistem menarik data dari PO dengan mencari nomor PR asli atau nomor PR parent (untuk PR SPK child)',
        'Apabila tidak ditemukan data dari PO, sistem menarik data langsung dari rincian PR sebagai fallback',
        'Lengkapi rincian LPP: tanggal transaksi, keterangan, jumlah biaya, nomor bukti, jenis pembayaran, dan produk terkait',
        'Total biaya dan sisa uang dikembalikan dihitung otomatis dari total Uang Muka dikurangi total rincian pengeluaran',
        'Lampirkan foto bukti transaksi (struk, bon, atau kwitansi) pada setiap rincian pengeluaran',
        'Simpan LPP dengan status PENDING untuk selanjutnya diverifikasi oleh pihak yang berwenang'
      ]
    },
    {
      title: 'Verifikasi & Pengelolaan LPP',
      order: 12,
      items: [
        'LPP berstatus PENDING diajukan untuk diverifikasi oleh admin atau PIC terkait',
        'Status LPP dapat diubah menjadi APPROVED, REJECTED, atau REVISION sesuai hasil pemeriksaan',
        'Saat LPP disetujui (APPROVED), sistem membuat jurnal akuntansi otomatis untuk proyek operasional (PROJECT_MOBILIZATION debit dan STAFF_ADVANCE kredit)',
        'Saldo tanggungan karyawan (Staff Balance) dan riwayat Staff Ledger diperbarui otomatis saat LPP disetujui',
        'LPP yang ditolak (REJECTED) atau perlu perbaikan (REVISION) dapat diperbaiki dan diajukan kembali oleh pengaju',
        'Rincian LPP dapat ditambah, diubah, dihapus, atau diperbarui secara massal (batch) selama proses berjalan',
        'Foto bukti pada rincian dapat ditambahkan, diperbarui keterangannya, atau dihapus beserta file-nya',
        'LPP dapat diduplikasi apabila terdapat pengeluaran berulang dengan rincian yang sama'
      ]
    },
    {
      title: 'Monitoring & Kontrol Budget',
      order: 13,
      items: [
        'Pantau seluruh PR melalui menu PR dengan tab filter Semua, Umum, dan Project',
        'Gunakan filter status, proyek, pencarian, dan rentang tanggal untuk mempersempit data',
        'Periksa status PR secara berkala: DRAFT, SUBMITTED, APPROVED, REJECTED, REVISION_NEEDED, dan COMPLETED',
        'Akses tab Purchase Orders pada detail PR untuk memantau apakah PR sudah diproses menjadi PO',
        'Sistem melakukan kontrol sisa budget otomatis agar total pengajuan tidak melebihi anggaran PR parent',
        'Gunakan tombol Recalculate Sisa Budget apabila diperlukan penghitungan ulang sisa anggaran'
      ]
    },
    {
      title: 'Penanganan Masalah & Pembatalan',
      order: 14,
      items: [
        'PR yang ditolak (REJECTED) atau perlu perbaikan (REVISION_NEEDED) dapat diperbaiki dan diajukan kembali oleh pengaju',
        'Hanya PR berstatus DRAFT atau REVISION_NEEDED yang dapat dihapus',
        'PR yang telah berstatus SUBMITTED ke atas tidak dapat dihapus dan harus diselesaikan melalui alur verifikasi',
        'Apabila PO gagal dibuat setelah PR disetujui, sistem membatalkan persetujuan PR dan melakukan rollback',
        'Sisa budget Parent PR diperbarui otomatis apabila PR child dihapus atau berubah status',
        'Apabila ditemukan ketidaksesuaian dokumen atau data, kembalikan PR kepada pengaju dengan catatan yang jelas'
      ]
    },
    {
      title: 'Dokumen & Menu Terkait',
      order: 15,
      items: [
        'Admin Area > Logistik > PR (pengajuan, pemantauan, dan tab filter Umum/Project)',
        'Admin Area > Logistik > PR Verify (verifikasi dan persetujuan PR)',
        'Admin Area > Logistik > Purchasing (pengelolaan Purchase Order hasil otomatisasi)',
        'Admin Area > Logistik > LPP (pembuatan dan pengelolaan Laporan Pengeluaran Perjalanan)',
        'Modul Inventory > Goods Receipts (penerimaan barang hasil PO)',
        'Modul Inventory > Requisition (pengeluaran barang via Material Requisition dari PR)',
        'SOP Penerimaan Barang (Goods Receipt)',
        'SOP Pengeluaran Barang (Material Requisition)',
        'SOP Pengendalian Inventori (Admin Inventory Control)'
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

  let existing = await prisma.document.findUnique({ where: { id: TARGET_ID } })
  if (!existing) {
    existing = await prisma.document.findFirst({ where: { title: TITLE } })
  }

  if (!existing) {
    console.log('Document not found, creating new...')
    const doc = await prisma.document.create({
      data: {
        title: TITLE,
        type: PR_SOP.type,
        version: PR_SOP.version,
        status: PR_SOP.status,
        content: PR_SOP.content,
        createdById: admin.id,
        sections: {
          create: PR_SOP.sections.map(s => ({
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
          create: PR_SOP.departments.map(dCode => ({
            department: { connect: { code: dCode } },
            isPrimary: true
          }))
        }
      }
    })
    console.log(`Created SOP: ${doc.title} (${doc.id})`)
    return
  }

  const updated = await prisma.document.update({
    where: { id: existing.id },
    data: {
      title: TITLE,
      type: PR_SOP.type,
      version: PR_SOP.version,
      status: PR_SOP.status,
      content: PR_SOP.content
    }
  })

  await prisma.documentDepartment.deleteMany({ where: { documentId: existing.id } })
  for (const dCode of PR_SOP.departments) {
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
  for (const s of PR_SOP.sections) {
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
