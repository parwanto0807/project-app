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

  const assemblySOPs = [
    {
      title: 'SOP Perakitan Barang (Assembly)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      content: 'Standar prosedur perakitan komponen dari stok gudang menjadi barang baru dengan Part Number baru melalui menu Perakitan Barang, mulai dari pembuatan DRAFT, penyelesaian yang mengubah stok, hingga pembatalan.',
      departments: ['OPS'],
      sections: [
        {
          title: 'Tujuan',
          order: 1,
          items: [
            'Menetapkan standar prosedur perakitan komponen stock gudang menjadi barang baru (Part Number) melalui menu Perakitan Barang',
            'Memastikan komponen yang dipakai dan barang hasil perakitan tercatat dengan benar pada stok gudang dan Kartu Stok',
            'Memberikan panduan bagi Admin/Operator Inventory dalam membuat draft perakitan, menyelesaikan, dan membatalkan perakitan'
          ]
        },
        {
          title: 'Ruang Lingkup',
          order: 2,
          items: [
            'Berlaku untuk seluruh proses perakitan barang yang menggunakan menu Perakitan Barang pada modul Inventory',
            'Mencakup pembuatan draft perakitan, penyelesaian (complete) yang mempengaruhi stok, pembatalan, serta monitoring riwayat',
            'Tidak berlaku untuk pemindahan barang antar gudang (Internal Transfer) dan proses penerimaan/pengeluaran barang biasa'
          ]
        },
        {
          title: 'Definisi & Istilah',
          order: 3,
          items: [
            'Perakitan (Assembly): proses menggabungkan beberapa komponen menjadi satu barang baru dengan Part Number baru',
            'Nomor Perakitan: nomor dokumen otomatis dengan format ASM-YYYYMM-XXXX, contoh: ASM-202608-0001',
            'Gudang Perakitan: gudang tempat komponen diambil dan barang hasil perakitan disimpan',
            'Komponen / Bahan: barang dari stok gudang yang digunakan sebagai bahan perakitan',
            'Hasil Perakitan (Output): barang baru yang dihasilkan setelah perakitan selesai',
            'Harga Pokok (COGS) Hasil: total biaya komponen, otomatis dihitung sistem sebagai harga pokok hasil perakitan',
            'Harga Per Unit: harga pokok total dibagi jumlah hasil perakitan',
            'DRAFT: status awal perakitan, stok gudang belum terpengaruh',
            'COMPLETED: status perakitan selesai, stok komponen berkurang dan stok hasil bertambah',
            'CANCELLED: status perakitan dibatalkan'
          ]
        },
        {
          title: 'Kebijakan',
          order: 4,
          items: [
            'Perakitan dibuat dalam status DRAFT terlebih dahulu; stok gudang tidak berubah saat draft dibuat',
            'Stok gudang baru berubah ketika perakitan diselesaikan (Selesai/COMPLETE)',
            'Wajib memilih gudang perakitan dan produk hasil perakitan dengan jumlah lebih dari 0',
            'Minimal 1 komponen (produk terisi dan jumlah lebih dari 0) wajib diisi',
            'Jumlah komponen tidak boleh melebihi stok tersedia di gudang perakitan',
            'Nomor perakitan dibuat otomatis oleh sistem dengan format ASM-TAHUNBULAN-NOMORURUT',
            'Harga pokok hasil perakitan otomatis mengikuti total biaya komponen dan dapat diedit manual',
            'Perakitan yang sudah COMPLETED tidak dapat dibatalkan'
          ]
        },
        {
          title: 'Prosedur Pembuatan Perakitan (DRAFT)',
          order: 5,
          items: [
            'Buka menu melalui sidebar: Admin Area > Inventory > Perakitan Barang',
            'Pada halaman History Perakitan, klik tombol "New Perakitan"',
            'Pilih Gudang (Asal Komponen & Hasil) - wajib, secara default terisi Bengkel',
            'Pilih Perakit/Karyawan (opsional) yang bertanggung jawab atas proses perakitan',
            'Isi Catatan (opsional) terkait proses perakitan',
            'Bagian 1 - Komponen/Bahan: klik "Tambah Komponen" untuk menambah baris komponen',
            'Cari komponen berdasarkan kode atau nama; hanya produk dengan stok tersedia yang ditampilkan',
            'Sistem otomatis mengisi Satuan dan Harga/Unit dari data produk',
            'Masukkan Jumlah komponen yang dibutuhkan; sistem menampilkan peringatan jika melebihi stok tersedia',
            'Ulangi untuk komponen lain atau hapus baris dengan tombol tempat sampah (minimal 1 komponen tersisa)',
            'Periksa "Total Biaya Komponen" yang tampil di bawah daftar komponen',
            'Bagian 2 - Hasil Perakitan: pilih "Produk Hasil Perakitan" (Part Number) dari master produk aktif',
            'Masukkan Jumlah Hasil dan sistem mengisi Satuan otomatis',
            'Isi Harga Pokok/Hasil (COGS) - otomatis terisi dari total biaya komponen, atau edit manual sesuai kebutuhan',
            'Periksa Harga Per Unit = Harga Pokok ÷ Jumlah Hasil',
            'Klik tombol "Simpan sebagai Draft"',
            'Setelah berhasil, muncul notifikasi "Perakitan berhasil disimpan sebagai DRAFT. Stock belum terpengaruh." dan kembali ke halaman riwayat'
          ]
        },
        {
          title: 'Proses Penyelesaian (Selesai) & Dampak Stok',
          order: 6,
          items: [
            'Buka halaman Perakitan Barang dan cari perakitan berstatus DRAFT',
            'Klik "View" untuk membuka detail, lalu klik tombol "Selesaikan Perakitan", atau klik tombol "Selesai" langsung pada baris',
            'Sistem memverifikasi stok komponen masih mencukupi; jika tidak, muncul pesan error "Stok tidak mencukupi"',
            'Komponen: stok keluar (Stock Out bertambah), Stok Akhir dan Stok Tersedia berkurang, nilai persediaan berkurang, serta tercatat Kartu Stok tipe OUT sumber ASSEMBLY',
            'Hasil perakitan: stok masuk (Stock In bertambah), Stok Akhir dan Stok Tersedia bertambah, nilai persediaan bertambah sesuai total harga pokok, serta tercatat Kartu Stok tipe IN sumber ASSEMBLY',
            'Status perakitan berubah menjadi COMPLETED dan muncul notifikasi "Perakitan diselesaikan, stock terupdate!"',
            'Referensi mutasi di Kartu Stok menggunakan nomor perakitan (reference no = nomor ASM-...)',
            'Konversi satuan diterapkan otomatis oleh sistem apabila satuan komponen/hasil berbeda dengan satuan simpan (storage unit) produk'
          ]
        },
        {
          title: 'Pembatalan Perakitan',
          order: 7,
          items: [
            'Pembatalan hanya dapat dilakukan pada perakitan berstatus DRAFT',
            'Klik tombol "Batal" pada baris perakitan atau tombol "Batal" pada halaman detail',
            'Sistem menampilkan konfirmasi pembatalan untuk nomor perakitan terkait',
            'Konfirmasi pembatalan, lalu status berubah menjadi CANCELLED',
            'Perakitan berstatus COMPLETED tidak dapat dibatalkan karena stok sudah terpengaruh'
          ]
        },
        {
          title: 'Monitoring & Pengecekan Riwayat',
          order: 8,
          items: [
            'Halaman Perakitan Barang menampilkan seluruh riwayat perakitan dengan kolom: No. Perakitan, Tanggal, Gudang, Hasil Perakitan, Komponen, dan Status',
            'Gunakan kotak pencarian untuk mencari berdasarkan nomor perakitan atau kode/nama produk hasil; klik "Cari"',
            'Status ditandai dengan warna: DRAFT (kuning), COMPLETED (hijau), CANCELLED (merah)',
            'Klik "View" untuk melihat detail: informasi perakitan, hasil perakitan, daftar komponen (kode, nama, jumlah, COGS), dan catatan',
            'Cocokkan jumlah dan harga komponen dengan fisik barang untuk memastikan perakitan sesuai'
          ]
        },
        {
          title: 'Penanganan Masalah',
          order: 9,
          items: [
            '"Pilih gudang (Bengkel)" => pastikan gudang perakitan sudah dipilih',
            '"Pilih produk hasil perakitan" => pilih produk Part Number hasil yang benar',
            '"Jumlah hasil perakitan harus lebih dari 0" => isi jumlah hasil minimal 0.01',
            '"Minimal 1 komponen harus diisi" => pastikan minimal satu komponen memiliki produk dan jumlah lebih dari 0',
            '"Ada komponen yang jumlahnya melebihi stok tersedia" => kurangi jumlah atau pilih komponen lain yang stoknya cukup',
            '"Stok tidak mencukupi" saat menyelesaikan => periksa kembali stok komponen di gudang, karena stok dapat berubah akibat transaksi lain; batalkan jika tidak dapat dipenuhi',
            '"Perakitan hanya bisa diselesaikan dari status DRAFT" => hanya perakitan DRAFT yang bisa diselesaikan atau dibatalkan',
            'Jika terjadi error saat menyimpan/menyelesaikan, catat pesan error dan laporkan ke tim IT/Admin Sistem'
          ]
        },
        {
          title: 'Dokumen & Menu Terkait',
          order: 10,
          items: [
            'Inventory > Stock Monitoring (pemantauan stok komponen dan hasil)',
            'Inventory > Stock Opname (penyesuaian stok)',
            'Master Data > Products (master produk dan Part Number)',
            'SOP Internal Transfer (Transfer Cepat Antar Gudang) untuk pemindahan barang antar gudang'
          ]
        }
      ]
    }
  ]

  for (const sopData of assemblySOPs) {
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

  console.log('Assembly SOP seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
