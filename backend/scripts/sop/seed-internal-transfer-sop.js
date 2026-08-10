import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin', active: true }
  })

  if (!admin) {
    console.error('No admin user found to associate as creator')
    return
  }

  const internalTransferSOPs = [
    {
      title: 'SOP Internal Transfer (Transfer Cepat Antar Gudang)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      content: 'Standar prosedur pemindahan stok barang antar gudang secara langsung (Direct Transfer) melalui menu Internal Transfer, dari Bengkel/Kantor ke WIP Project tanpa proses Material Requisition (MR), Goods Receipt (GR), maupun approval.',
      departments: ['OPS'],
      sections: [
        {
          title: 'Tujuan',
          order: 1,
          items: [
            'Menetapkan standar prosedur pemindahan stok barang antar gudang secara cepat (direct) tanpa melalui proses Material Requisition (MR) dan Goods Receipt (GR)',
            'Memastikan stok di gudang asal (Bengkel/Kantor) dan gudang tujuan (WIP Project) selalu akurat dan terupdate otomatis oleh sistem',
            'Memberikan panduan bagi Admin/Operator Inventory dalam membuat, memverifikasi, dan memantau transaksi Internal Transfer'
          ]
        },
        {
          title: 'Ruang Lingkup',
          order: 2,
          items: [
            'Berlaku untuk seluruh transaksi pemindahan barang antar gudang yang menggunakan menu Internal Transfer pada modul Inventory',
            'Mencakup proses pembuatan transfer, validasi data, konfirmasi, hingga pengecekan riwayat transfer',
            'Tidak berlaku untuk pemindahan barang dengan proses MR/GR normal, Stock Transfer berstatus In-Transit, dan transfer antar akun kas/bank'
          ]
        },
        {
          title: 'Definisi & Istilah',
          order: 3,
          items: [
            'Internal Transfer (Direct Transfer): pemindahan stok langsung antar gudang tanpa MR/GR dan tanpa approval, nomor dokumen berawalan DT-',
            'Gudang Asal (Dari): gudang tempat barang keluar, contoh: Bengkel/Kantor',
            'Gudang Tujuan (Ke): gudang tempat barang masuk, contoh: WIP Project',
            'WIP (Work In Progress): gudang kerja yang menampung material proyek yang sedang berjalan',
            'Pengirim (Sender): karyawan yang bertanggung jawab atas transaksi transfer',
            'Stok Tersedia (Available Stock): jumlah stok yang dapat dipindahkan pada saat transaksi',
            'Stok Akhir (Stock Akhir): saldo stok produk di gudang pada periode berjalan',
            'COGS / Harga per Unit: harga pokok per unit barang yang dibawa saat transfer',
            'Kartu Stok (Stock Detail): riwayat mutasi barang masuk (IN) dan keluar (OUT) per gudang'
          ]
        },
        {
          title: 'Kebijakan',
          order: 4,
          items: [
            'Internal Transfer bersifat langsung (instant): stok langsung terpotong di gudang asal dan bertambah di gudang tujuan setelah konfirmasi',
            'Tidak memerlukan persetujuan (approval), namun kolom Pengirim wajib diisi oleh karyawan yang valid',
            'Gudang asal dan tujuan harus berbeda; sistem menolak transaksi jika kedua gudang sama',
            'Jumlah transfer tidak boleh melebihi stok tersedia di gudang asal',
            'Minimal 1 item (produk terisi dan jumlah lebih dari 0) wajib diisi',
            'Nomor transfer dibuat otomatis oleh sistem dengan format DT-TAHUNBULAN-NOMORURUT, contoh: DT-202608-0001',
            'Status transaksi langsung menjadi "RECEIVED" (transfer selesai diterima)',
            'Nilai transfer dihitung dari jumlah x harga/unit (COGS) dan ikut mengubah nilai persediaan (inventory value) kedua gudang'
          ]
        },
        {
          title: 'Prosedur Pembuatan Internal Transfer',
          order: 5,
          items: [
            'Pastikan sudah login sebagai Admin dengan akses modul Inventory',
            'Siapkan data: gudang asal, gudang tujuan, nama pengirim, dan daftar barang yang akan dipindahkan',
            'Buka menu melalui sidebar: Admin Area > Inventory > Internal Transfer',
            'Pada halaman Internal Transfer, klik tombol hijau "New Transfer"',
            'Pada kolom "Dari Gudang" pilih gudang asal (wajib) - secara default terisi Bengkel',
            'Pada kolom "Ke Gudang" pilih gudang tujuan (wajib) - secara default terisi WIP Project dan tidak boleh sama dengan gudang asal',
            'Pada kolom "Pengirim" pilih karyawan pengirim (wajib)',
            'Isi "Catatan" (opsional), misalnya nomor SO dan SPK agar data transfer lebih lengkap',
            'Klik "Tambah Barang" untuk menambahkan baris item',
            'Cari produk menggunakan kolom pencarian kode atau nama produk; hanya produk dengan stok tersedia yang ditampilkan',
            'Sistem otomatis mengisi Satuan, Stok Tersedia, Stok Akhir, dan Harga/Unit dari data produk yang dipilih',
            'Masukkan Jumlah (quantity) barang yang akan dipindahkan',
            'Ulangi langkah penambahan barang untuk item lain bila diperlukan, atau hapus item dengan tombol tempat sampah (minimal 1 item tersisa)',
            'Pastikan tidak ada peringatan merah "Melebihi stok tersedia"',
            'Klik tombol "Transfer Sekarang"',
            'Sistem menampilkan dialog konfirmasi berisi ringkasan: gudang asal, gudang tujuan, pengirim, dan daftar barang',
            'Periksa kembali seluruh data, lalu klik "Konfirmasi & Transfer"',
            'Setelah berhasil, muncul notifikasi "Internal transfer berhasil!" dan sistem kembali ke halaman riwayat transfer'
          ]
        },
        {
          title: 'Dampak Sistem / Alur Stok',
          order: 6,
          items: [
            'Sistem membuat nomor transfer otomatis berformat DT-YYYYMM-XXXX',
            'Status transfer langsung menjadi "RECEIVED"',
            'Gudang asal: Stok Out bertambah, Stok Akhir dan Stok Tersedia berkurang, nilai persediaan (inventory value) berkurang, serta tercatat Kartu Stok tipe OUT sumber TRANSFER',
            'Gudang tujuan: Stok In bertambah, Stok Akhir dan Stok Tersedia bertambah, nilai persediaan (inventory value) bertambah, serta tercatat Kartu Stok tipe IN sumber TRANSFER',
            'Konversi satuan diterapkan otomatis oleh sistem apabila satuan yang dipilih berbeda dengan satuan simpan (storage unit) produk',
            'Referensi mutasi di Kartu Stok menggunakan nomor transfer (reference no = nomor DT-...)'
          ]
        },
        {
          title: 'Monitoring & Pengecekan Riwayat',
          order: 7,
          items: [
            'Halaman Internal Transfer menampilkan seluruh transfer berawalan DT- dengan kolom: Nomor Transfer, Tanggal, Dari, Ke, Catatan, Jumlah Item, dan Status',
            'Gunakan kotak pencarian untuk mencari berdasarkan nomor transfer, produk, atau nama gudang; klik "Cari" untuk mencari dan "Clear" untuk menghapus pencarian',
            'Data ditampilkan 10 baris per halaman; gunakan tombol Previous/Next untuk berpindah halaman',
            'Klik "View" pada baris transfer untuk melihat detail: informasi transfer, perpindahan gudang, catatan, daftar item (kode, nama, jumlah, harga/unit, total), dan ringkasan total nilai',
            'Cocokkan jumlah item dan total nilai dengan catatan fisik untuk memastikan data transfer sudah sesuai'
          ]
        },
        {
          title: 'Penanganan Masalah',
          order: 8,
          items: [
            '"Gudang asal dan tujuan harus berbeda" => pilih dua gudang yang berbeda',
            '"Minimal 1 item harus ditransfer" => pastikan minimal satu item memiliki produk dan jumlah lebih dari 0',
            '"Ada item yang jumlahnya melebihi stok tersedia" => kurangi jumlah atau pilih produk lain yang stoknya mencukupi',
            '"Pilih karyawan pengirim" => lengkapi kolom pengirim sebelum menyimpan',
            '"Stok tidak mencukupi" saat menyimpan => periksa kembali stok tersedia di gudang asal, karena stok dapat berubah akibat transaksi lain',
            'Transfer tidak muncul di riwayat => pastikan nomor transfer berawalan DT- dan lakukan pencarian/refresh halaman',
            'Apabila terjadi error saat submit, catat pesan error dan laporkan ke tim IT/Admin Sistem'
          ]
        },
        {
          title: 'Dokumen & Menu Terkait',
          order: 9,
          items: [
            'Master Data > Warehouse Management (pengaturan master gudang)',
            'Inventory > Stock Monitoring (pemantauan stok seluruh gudang)',
            'Inventory > Stock Opname (penyesuaian stok)',
            'SOP Transfer Gudang (Stock Transfer) untuk pemindahan barang dengan proses approval/In-Transit',
            'SOP Penerimaan Barang (Goods Receipt) dan SOP Pengeluaran Barang (Material Requisition)'
          ]
        }
      ]
    }
  ]

  for (const sopData of internalTransferSOPs) {
    const existing = await prisma.document.findFirst({
      where: { title: sopData.title }
    })

    if (existing) {
      console.log(`SOP "${sopData.title}" already exists, skipping...`)
      continue
    }

    const doc = await prisma.document.create({
      data: {
        title: sopData.title,
        type: sopData.type,
        version: sopData.version,
        status: sopData.status,
        content: sopData.content,
        createdById: admin.id,
        sections: {
          create: sopData.sections.map(s => ({
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
          create: sopData.departments.map(dCode => ({
            department: { connect: { code: dCode } },
            isPrimary: true
          }))
        }
      }
    })
    console.log(`Created SOP: ${doc.title}`)
  }

  console.log('Internal Transfer SOP seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
