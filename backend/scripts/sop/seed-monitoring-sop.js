import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const TITLE = 'SOP Monitoring Stock (Pemantauan Stok)'
const TARGET_ID = '7672c6c1-edbf-4641-8bfb-32ff37260760'

const MON_SOP = {
  type: 'SOP',
  version: 'FRM-SOP-INV-01',
  status: 'ACTIVE',
  content: 'Standar prosedur pemantauan stok gudang melalui menu Inventory Dashboard (Admin Area > Inventory > Dashboard). Meliputi ringkasan statistik stok (Total Value, Total Items, Safe, Low, Critical, Inactive), penggunaan filter periode/bulan, pencarian produk, filter gudang dan status kesehatan stok, penelusuran detail stok (mutasi, booking PR, On PO), cetak laporan Saldo Stok (PDF) dan form Stock Opname (PDF), hingga pemantauan top usage dan top value.',
  departments: ['OPS'],
  sections: [
    {
      title: 'Tujuan',
      order: 1,
      items: [
        'Menetapkan standar prosedur pemantauan stok gudang secara real-time melalui menu Inventory Dashboard',
        'Memberikan pandangan menyeluruh terhadap distribusi stok di seluruh gudang beserta mutasi per periode',
        'Memastikan kesehatan stok terpantau melalui klasifikasi status (SAFE, WARNING, CRITICAL, dan Inactive)',
        'Memastikan pengguna dapat menelusuri detail produk hingga ke mutasi kartu stok, booking PR, dan posisi On PO',
        'Memastikan laporan Saldo Stok dan form Stock Opname dapat dicetak sesuai filter yang digunakan'
      ]
    },
    {
      title: 'Ruang Lingkup',
      order: 2,
      items: [
        'Berlaku untuk seluruh aktivitas pemantauan stok pada menu Admin Area > Inventory > Dashboard',
        'Mencakup ringkasan statistik, filter periode/gudang/status, pencarian produk, detail stok, cetak laporan, dan widget top usage / top value',
        'Data ditampilkan per periode bulan (YYYY-MM) dan dapat difilter berdasarkan gudang',
        'Menu ini bersifat read-only (monitoring); seluruh mutasi stok bersumber dari modul transaksi lain (GR, MR, Transfer, Stock Opname)'
      ]
    },
    {
      title: 'Definisi & Istilah',
      order: 3,
      items: [
        'Stock Balance: saldo stok produk pada gudang dan periode tertentu',
        'Periode: bulan penampilan data berformat YYYY-MM, contoh 2026-08',
        'Stok Awal (stockAwal): saldo stok pada awal periode',
        'Stok Masuk (stockIn): total barang masuk periode berjalan',
        'Stok Keluar (stockOut): total barang keluar periode berjalan',
        'Stok Akhir (stockAkhir): saldo stok fisik pada akhir periode',
        'Stok Tersedia (availableStock): stok siap pakai = stok akhir dikurangi booked stock',
        'Booked Stock: stok yang sudah dialokasikan/dipesan melalui Purchase Request (PR)',
        'On PO / On PR: jumlah barang yang masih dalam proses pemesanan (belum diterima)',
        'Nilai Persediaan (inventoryValue): nilai bersih stok pada gudang dan periode tersebut',
        'SAFE: stok tersedia lebih dari sama dengan 10 unit',
        'WARNING (Low): stok tersedia lebih dari 0 namun kurang dari 10 unit',
        'CRITICAL: stok tersedia nol atau negatif',
        'Inactive: produk berstatus nonaktif',
        'Kartu Stok (Stock Detail): riwayat mutasi barang masuk (IN) dan keluar (OUT)',
        'Top Usage: produk dengan pemakaian tertinggi pada periode',
        'Top Value: produk dengan nilai persediaan tertinggi pada periode'
      ]
    },
    {
      title: 'Kebijakan',
      order: 4,
      items: [
        'Dashboard hanya menampilkan produk yang aktif, kecuali pengguna secara khusus memilih filter Inactive',
        'Seluruh data stok mengikuti periode yang dipilih; mengubah periode akan memuat ulang seluruh data dan statistik',
        'Klasifikasi kesehatan stok ditentukan dari Stok Tersedia (availableStock): CRITICAL (<= 0), WARNING (0 < x < 10), SAFE (>= 10)',
        'Kolom Nilai Bersih (Total Value) dan nilai per produk hanya tampil untuk pengguna dengan role admin / super_admin',
        'Cetak Laporan Stock Opname hanya tersedia untuk role admin / super_admin',
        'Data diperbarui otomatis setiap 5 menit; gunakan tombol Refresh untuk memperbarui secara manual',
        'Dashboard bersifat read-only; perubahan stok tidak dilakukan dari halaman ini'
      ]
    },
    {
      title: 'Status Kesehatan Stok',
      order: 5,
      items: [
        'SAFE (Aman): Stok Tersedia >= 10, ditandai warna hijau pada badge status',
        'WARNING (Low): Stok Tersedia antara 1 sampai 9, ditandai warna kuning/amber',
        'CRITICAL (Kritis): Stok Tersedia <= 0, ditandai warna merah dan wajib ditindaklanjuti',
        'Inactive: produk nonaktif ditampilkan lebih redup (opacity rendah) dengan badge "Inactive"',
        'Kartu statistik menampilkan jumlah masing-masing kategori: Total Items, Safe, Low, Critical, dan Inactive',
        'Produk berstatus CRITICAL sebaiknya segera direncanakan pengadaannya melalui Purchase Request (PR)'
      ]
    },
    {
      title: 'Prosedur Penggunaan Dashboard',
      order: 6,
      items: [
        'Buka menu melalui sidebar: Admin Area > Inventory > Dashboard',
        'Perhatikan kartu statistik di bagian atas: Total Value (khusus admin), Total Items, Safe, Low, Critical, dan Inactive',
        'Lihat widget Top Usage (produk paling banyak keluar) dan Top Value (produk dengan nilai tertinggi) pada periode terpilih',
        'Gunakan kolom-kolom tabel: Detail Aset, Stok Awal, Arus Stok (Masuk/Keluar), Aktivitas (Just In/Just Out), Stok Akhir, On PO, Dialokasikan (Booked), Stok Tersedia, Nilai Bersih, Diperbarui, dan Kesehatan',
        'Pada mode mobile (lebar layar < 1024px), data ditampilkan sebagai kartu; gunakan tombol toggle Desktop/Mobile untuk berpindah tampilan',
        'Gunakan pagination untuk menelusuri daftar stok yang panjang',
        'Gunakan tombol Refresh Data untuk memperbarui data, atau tunggu pembaruan otomatis setiap 5 menit'
      ]
    },
    {
      title: 'Prosedur Filter & Pencarian',
      order: 7,
      items: [
        'Filter Periode: pilih bulan pada kolom tanggal tipe month (format YYYY-MM); data dan statistik menyesuaikan periode tersebut',
        'Filter Gudang: pilih lokasi pada dropdown "Location"; pilih "All Warehouses" untuk seluruh gudang',
        'Filter Status: pilih kategori pada dropdown status atau tab All / Critical / Low / Inactive',
        'Pencarian: ketik nama produk, SKU/kode, atau kategori pada kolom pencarian; pencarian baru berjalan otomatis setelah 2 karakter (debounce 500ms)',
        'Pencarian multi-kata berlaku sebagai AND antar kata',
        'Setiap perubahan filter otomatis mereset ke halaman pertama',
        'Gunakan tombol Refresh untuk memuat ulang data sesuai filter yang aktif'
      ]
    },
    {
      title: 'Prosedur Penelusuran Detail Stok',
      order: 8,
      items: [
        'Klik ikon mata (View) pada baris produk untuk membuka panel detail stok',
        'Panel menampilkan ringkasan: Stok Awal, Stok Akhir, Stok Masuk, dan Stok Keluar',
        'Bagian Stock Bookings menampilkan daftar Purchase Request yang mengalokasikan stok produk tersebut beserta jumlah terbooking dan sisa belum terpenuhi',
        'Bagian Purchase Orders (On PO) menampilkan daftar Purchase Order yang masih berjalan beserta supplier, jumlah On PO, dan sisa belum diterima',
        'Bagian Transaction History menampilkan riwayat mutasi (IN/OUT/ADJUSTMENT) produk pada periode terpilih lengkap dengan tanggal, referensi nomor dokumen, gudang, jumlah, dan saldo akhir',
        'Gunakan tooltip pada kolom Stok Akhir dan Stok Tersedia untuk melihat konversi satuan (purchase unit ke storage unit dan storage unit ke usage unit)'
      ]
    },
    {
      title: 'Prosedur Cetak Laporan',
      order: 9,
      items: [
        'Cetak Laporan Saldo Stok: klik tombol "Print Report" untuk membuat PDF laporan saldo stok sesuai filter aktif',
        'Sistem akan mengambil seluruh data (tanpa batas pagination) sesuai periode dan filter yang dipilih',
        'Laporan PDF menampilkan per produk: kode, nama, stok awal, stok masuk, stok keluar, stok akhir, booked, stok tersedia, On PO, nilai persediaan, dan gudang',
        'Cetak Form Stock Opname: klik tombol "Print Stock Opname" (khusus admin/super_admin)',
        'Form Stock Opname dikelompokkan per gudang dan menampilkan daftar produk dengan kolom stok sistem untuk dicocokkan dengan stok fisik',
        'Apabila tidak ada data, sistem menampilkan pesan "Tidak ada data untuk dicetak" dan laporan tidak dibuat'
      ]
    },
    {
      title: 'Widget Top Usage & Top Value',
      order: 10,
      items: [
        'Top Usage menampilkan produk dengan total pemakaian (stockOut) tertinggi pada periode dan gudang terpilih',
        'Top Value menampilkan produk dengan nilai persediaan (inventoryValue) tertinggi pada periode dan gudang terpilih',
        'Kedua widget mengikuti periode dan filter gudang yang sedang aktif pada dashboard',
        'Gunakan informasi ini untuk prioritas pengadaan dan pengendalian nilai inventori'
      ]
    },
    {
      title: 'Monitoring & Pengecekan',
      order: 11,
      items: [
        'Periksa kartu statistik secara berkala untuk mengetahui jumlah produk CRITICAL dan WARNING',
        'Pastikan produk berstatus CRITICAL segera ditindaklanjuti melalui proses Purchase Request',
        'Cek kolom Diperbarui (updatedAt) untuk memastikan data stok masih segar',
        'Lihat footer dashboard untuk waktu sinkronisasi terakhir (data diperbarui otomatis setiap 5 menit)',
        'Lakukan pencocokan saldo akhir sistem dengan mutasi fisik melalui detail Transaction History',
        'Gunakan laporan Stock Opname untuk verifikasi fisik stok gudang secara berkala'
      ]
    },
    {
      title: 'Penanganan Masalah',
      order: 12,
      items: [
        'Data kosong pada periode tertentu => pastikan periode yang dipilih benar dan terdapat Stock Balance pada bulan tersebut',
        'Produk tidak muncul pada pencarian => periksa penulisan nama/kode/kategori; pastikan produk berstatus aktif kecuali filter Inactive dipilih',
        'Kolom Nilai Bersih tidak tampil => pastikan Anda login dengan role admin / super_admin',
        'Tombol Print Stock Opname tidak tampil => fitur khusus role admin / super_admin',
        'Laporan PDF tidak terunduh => pastikan ada data pada filter yang dipilih dan modul PDF dapat dimuat',
        'Stok tersedia (available) lebih kecil dari stok akhir => wajar karena sebagian stok terbooking (booked) oleh PR'
      ]
    },
    {
      title: 'Dokumen & Menu Terkait',
      order: 13,
      items: [
        'Logistic > Purchasing / Purchase Request (perencanaan pengadaan untuk stok CRITICAL)',
        'Inventory > Goods Receipts (penerimaan barang yang menambah stok masuk)',
        'Inventory > Requisition (pengeluaran barang yang mengurangi stok keluar)',
        'Inventory > Kartu Stok (detail mutasi setiap produk)',
        'Inventory > Stock Opname (pencocokan stok fisik dengan sistem)',
        'SOP Internal Transfer (Transfer Cepat Antar Gudang) untuk mutasi antar gudang'
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
        type: MON_SOP.type,
        version: MON_SOP.version,
        status: MON_SOP.status,
        content: MON_SOP.content,
        createdById: admin.id,
        sections: {
          create: MON_SOP.sections.map(s => ({
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
          create: MON_SOP.departments.map(dCode => ({
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
      type: MON_SOP.type,
      version: MON_SOP.version,
      status: MON_SOP.status,
      content: MON_SOP.content
    }
  })

  await prisma.documentDepartment.deleteMany({ where: { documentId: existing.id } })
  for (const dCode of MON_SOP.departments) {
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
  for (const s of MON_SOP.sections) {
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
