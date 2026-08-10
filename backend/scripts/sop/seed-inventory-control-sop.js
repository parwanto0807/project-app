import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const TITLE = 'SOP Pengendalian Inventori (Admin Inventory Control)'
const TARGET_ID = 'd728ca02-33b5-4870-a316-a2c42a00d575'

const INV_SOP = {
  type: 'SOP',
  version: 'FRM-SOP-INV-04',
  status: 'ACTIVE',
  content: 'Standar prosedur pengendalian inventori yang dijalankan oleh Admin Inventory Control untuk menjamin keakuratan data stok fisik dan sistem, pengelolaan keluar-masuk barang secara terkendali, serta kelengkapan administrasi gudang. Meliputi pemantauan stok real-time, penerimaan barang (Goods Receipt), pengeluaran barang (Material Requisition), mutasi antar gudang (Internal Transfer), pelaksanaan stock opname, serta administrasi dan pelaporan mutasi gudang.',
  departments: ['OPS'],
  sections: [
    {
      title: 'Tujuan',
      order: 1,
      items: [
        'Menetapkan standar prosedur pengendalian inventori gudang yang dijalankan oleh Admin Inventory Control',
        'Menjamin keakuratan data stok fisik dengan data yang tercatat pada sistem ERP',
        'Memastikan seluruh barang masuk dan keluar melalui pencatatan sistem dengan dokumen yang sah',
        'Mencegah terjadinya selisih, kerusakan, atau kehilangan inventaris',
        'Memastikan ketersediaan material untuk mendukung kelancaran operasional harian dan proyek'
      ]
    },
    {
      title: 'Ruang Lingkup',
      order: 2,
      items: [
        'Berlaku untuk seluruh kegiatan pengendalian inventori pada gudang yang dikelola oleh Admin Inventory Control',
        'Mencakup pemantauan stok, penerimaan barang, pengeluaran barang, mutasi antar gudang, stock opname, serta administrasi dan pelaporan',
        'Berlaku untuk gudang utama (main), gudang WIP (proyek), serta perpindahan barang antar gudang',
        'Seluruh transaksi dicatat pada modul Inventory dan modul terkait di sistem ERP'
      ]
    },
    {
      title: 'Definisi & Istilah',
      order: 3,
      items: [
        'Admin Inventory Control: petugas yang bertanggung jawab atas pengendalian inventori dan administrasi gudang',
        'Stock Balance: saldo stok produk pada gudang dan periode tertentu',
        'Stok Tersedia (availableStock): stok siap pakai = stok akhir dikurangi booked stock',
        'Goods Receipt (GR): dokumen penerimaan barang dari vendor berdasarkan Purchase Order (PO)',
        'Material Requisition (MR): dokumen pengeluaran barang dari gudang proyek',
        'Internal Transfer: pemindahan stok antar gudang (contoh: Gudang Bengkel ke Gudang WIP)',
        'Stock Opname: penghitungan fisik inventaris untuk dicocokkan dengan data sistem',
        'Booked Stock: stok yang dialokasikan melalui Purchase Request (PR)',
        'On PO / On PR: jumlah barang yang masih dalam proses pemesanan',
        'Kartu Stok (Stock Detail): riwayat mutasi barang masuk (IN) dan keluar (OUT)'
      ]
    },
    {
      title: 'Kebijakan',
      order: 4,
      items: [
        'Seluruh arus keluar-masuk barang wajib melalui pencatatan sistem dan didukung dokumen resmi yang disetujui',
        'Barang tidak diperkenankan keluar dari gudang tanpa dokumen permintaan yang sah',
        'Penerimaan barang dari vendor wajib diverifikasi jumlah, spesifikasi, dan kualitas sesuai Purchase Order (PO)',
        'Pengeluaran material untuk kebutuhan produksi/proyek wajib dicatat melalui Material Requisition (MR)',
        'Setiap perpindahan material antar gudang wajib dicatat melalui transaksi Internal Transfer di sistem ERP',
        'Stock opname wajib dilaksanakan secara berkala (harian/bulanan/tahunan sesuai jadwal)',
        'Setiap selisih hasil opname wajib diinvestigasi dan dilaporkan beserta berita acara penyelesaiannya',
        'Admin Inventory Control berwenang menolak penerimaan barang tanpa dokumen PO yang valid atau tidak sesuai spesifikasi'
      ]
    },
    {
      title: 'Prosedur Pemantauan Stok (Monitoring)',
      order: 5,
      items: [
        'Buka menu melalui sidebar: Admin Area > Inventory > Dashboard',
        'Pantau kartu statistik: Total Items, Safe, Low, Critical, dan Inactive serta Total Value (khusus admin)',
        'Gunakan filter periode (bulan), filter gudang, filter status, dan pencarian produk untuk mempersempit data',
        'Perhatikan klasifikasi kesehatan stok: CRITICAL (stok tersedia <= 0), WARNING (0 < x < 10), SAFE (>= 10)',
        'Gunakan tombol Refresh untuk memperbarui data atau tunggu sinkronisasi otomatis setiap 5 menit',
        'Apabila terdapat stok CRITICAL atau mendekati batas minimum, berikan peringatan dini kepada bagian purchasing',
        'Klik ikon mata pada baris produk untuk menelusuri detail stok, mutasi, booking PR, dan posisi On PO'
      ]
    },
    {
      title: 'Prosedur Penerimaan Barang (Inbound)',
      order: 6,
      items: [
        'Buka menu Goods Receipts di modul Inventory dan buat GR berdasarkan Purchase Order berstatus APPROVED',
        'Verifikasi fisik barang dari vendor atau gudang pusat meliputi jumlah, spesifikasi, dan kualitas',
        'Cocokkan barang yang diterima dengan dokumen Purchase Order (PO) dan Surat Jalan (SJ)',
        'Catat penerimaan pada sistem: qty diterima, qty lolos (passed), dan qty ditolak (rejected) melalui proses QC Check',
        'Lengkapi Nomor Surat Jalan, tanggal diterima, gudang tujuan, dan petugas penerima (received by)',
        'Status GR menjadi COMPLETED setelah di-approve dan stok gudang otomatis bertambah',
        'Apabila ditemukan barang tidak sesuai spesifikasi, lakukan penolakan sesuai prosedur retur vendor',
        'Arsipkan dokumen Surat Jalan dan Goods Received Note (GRN) secara rapi'
      ]
    },
    {
      title: 'Prosedur Pengeluaran Barang (Outbound)',
      order: 7,
      items: [
        'Pastikan permintaan material didasarkan pada dokumen Material Requisition (MR) yang sah',
        'Periksa ketersediaan stok sebelum pengeluaran: stok tersedia dan batch fisik mencukupi',
        'Lakukan picking barang sesuai daftar item MR (produk, qty diminta, satuan)',
        'Validasi MR melalui pemindaian QR Code atau input kode MR pada proses Scan & Issue',
        'Status MR berubah menjadi ISSUED dan stok gudang terpotong sesuai metode FIFO',
        'Pastikan identitas petugas pengeluaran (issuedBy) tercatat',
        'Untuk gudang WIP, lakukan posting jurnal pemakaian material setelah MR berstatus ISSUED',
        'Catat setiap pengeluaran agar saldo stok sistem tetap akurat dan dapat ditelusuri'
      ]
    },
    {
      title: 'Prosedur Mutasi & Perpindahan Barang (Internal Transfer)',
      order: 8,
      items: [
        'Setiap permintaan material oleh Tim Produksi dari Gudang Bengkel ke Gudang WIP wajib diinput melalui transaksi Transfer Internal',
        'Setiap perpindahan barang antar gudang, rak penyimpanan, atau lokasi proyek wajib dicatat secara tertib di sistem',
        'Lengkapi data transfer: gudang asal, gudang tujuan, item, jumlah, satuan, dan petugas pengirim',
        'Sistem membuat MR Auto-Generate dan GR terkait untuk mencatat pengeluaran dan penerimaan antar gudang',
        'Sistem memotong stok gudang asal dan menambahkan stok gudang tujuan setelah proses selesai',
        'Apabila proses produksi/proyek selesai dan terdapat sisa material, input Transfer Internal lanjutan dari Gudang WIP kembali ke Gudang Bengkel',
        'Pastikan stok sisa tercatat kembali ke inventaris aktif secara akurat'
      ]
    },
    {
      title: 'Prosedur Stock Opname & Audit Internal',
      order: 9,
      items: [
        'Rencanakan jadwal stock opname secara berkala (harian, bulanan, atau tahunan) sesuai kebijakan perusahaan',
        'Persiapkan daftar produk per gudang dari sistem sebagai dasar penghitungan fisik (form Stock Opname)',
        'Lakukan penghitungan fisik barang di lapangan sesuai lokasi penyimpanan',
        'Cocokkan hasil perhitungan fisik dengan saldo akhir yang tercatat pada sistem ERP',
        'Cetak form Stock Opname dari menu Inventory Dashboard untuk memudahkan pencocokan per gudang',
        'Jika ditemukan selisih, kerusakan, atau kehilangan barang, investigasi penyebabnya dan siapkan berita acara penyelesaian',
        'Input hasil opname dan penyesuaian (adjustment) ke sistem melalui modul Stock Opname',
        'Laporkan hasil opname beserta analisis selisih (variance) kepada atasan'
      ]
    },
    {
      title: 'Administrasi & Dokumentasi Gudang',
      order: 10,
      items: [
        'Arsipkan seluruh dokumen pendukung operasional gudang (Surat Jalan, Goods Received Note/GRN, Material Request Slip) secara rapi dan sistematis, baik fisik maupun digital',
        'Terapkan sistem penataan barang terstandar (5S/Housekeeping) di area gudang',
        'Pastikan setiap item memiliki label identifikasi yang jelas (kode produk, nama, satuan)',
        'Susun dan sampaikan laporan berkala mengenai posisi stok dan mutasi harian kepada atasan',
        'Pantau daftar barang slow-moving atau dead stock untuk ditindaklanjuti',
        'Pastikan seluruh administrasi dicatat sesuai dengan transaksi fisik yang terjadi'
      ]
    },
    {
      title: 'Koordinasi Operasional & Produksi',
      order: 11,
      items: [
        'Berkoordinasi dengan bagian produksi atau project untuk memastikan ketersediaan material sesuai jadwal kerja',
        'Sinkronkan kebutuhan material dengan realita stok gudang',
        'Kelola administrasi dan pencatatan untuk pengembalian barang (vendor return) yang tidak sesuai spesifikasi atau rusak',
        'Berikan peringatan dini kepada purchasing ketika stok mendekati batas minimum',
        'Tindak lanjuti setiap permintaan material agar tidak menghambat jadwal produksi/proyek'
      ]
    },
    {
      title: 'Tanggung Jawab & Wewenang',
      order: 12,
      items: [
        'Bertanggung jawab penuh atas kecocokan antara fisik barang di gudang dengan data saldo yang tercatat pada sistem ERP',
        'Berwenang menolak penerimaan barang dari vendor jika tidak disertai dokumen PO yang valid atau tidak sesuai spesifikasi',
        'Berwenang mengatur dan membatasi akses keluar-masuk area penyimpanan demi keamanan inventaris',
        'Memastikan seluruh alur keluar-masuk barang melewati pencatatan sistem',
        'Menolak pengeluaran barang tanpa dokumen resmi yang disetujui'
      ]
    },
    {
      title: 'Monitoring, Pelaporan & Penanganan Masalah',
      order: 13,
      items: [
        'Pantau dashboard stok secara rutin dan tindaklanjuti status CRITICAL / WARNING',
        'Gunakan laporan mutasi dan stock opname sebagai dasar evaluasi akurasi inventori',
        'Apabila stok sistem tidak sesuai dengan fisik, lakukan investigasi dan pencatatan penyesuaian melalui stock opname',
        'Apabila terdapat dokumen yang tidak lengkap, tolak proses hingga dokumen dilengkapi',
        'Jika terjadi selisih berulang, laporkan kepada atasan untuk perbaikan prosedur'
      ]
    },
    {
      title: 'Dokumen & Menu Terkait',
      order: 14,
      items: [
        'Inventory > Dashboard (pemantauan stok real-time dan cetak laporan)',
        'Inventory > Goods Receipts (penerimaan barang dari vendor)',
        'Inventory > Requisition (pengeluaran barang via Material Requisition)',
        'Inventory > Stock Opname (penghitungan fisik dan penyesuaian stok)',
        'SOP Monitoring Stock (Pemantauan Stok)',
        'SOP Penerimaan Barang (Goods Receipt)',
        'SOP Pengeluaran Barang (Material Requisition)',
        'SOP Internal Transfer (Transfer Cepat Antar Gudang)'
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
        type: INV_SOP.type,
        version: INV_SOP.version,
        status: INV_SOP.status,
        content: INV_SOP.content,
        createdById: admin.id,
        sections: {
          create: INV_SOP.sections.map(s => ({
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
          create: INV_SOP.departments.map(dCode => ({
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
      type: INV_SOP.type,
      version: INV_SOP.version,
      status: INV_SOP.status,
      content: INV_SOP.content
    }
  })

  await prisma.documentDepartment.deleteMany({ where: { documentId: existing.id } })
  for (const dCode of INV_SOP.departments) {
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
  for (const s of INV_SOP.sections) {
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
