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

  const inventorySOPs = [
    {
      title: 'SOP Monitoring Stock (Pemantauan Stok)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      sections: [
        {
          title: 'Pemantauan Real-time',
          order: 1,
          items: [
            'Buka modul Inventory > Stock Monitoring',
            'Sistem menampilkan daftar produk beserta total stok tersedia di seluruh gudang',
            'Gunakan fitur pencarian dan filter kategori untuk mempersempit pencarian'
          ]
        },
        {
          title: 'Audit Kartu Stok',
          order: 2,
          items: [
            'Klik pada baris produk untuk melihat rincian mutasi',
            'Sistem menampilkan riwayat masuk (In) dan keluar (Out) setiap barang',
            'Pastikan saldo akhir di sistem sesuai dengan transaksi fisik terakhir'
          ]
        }
      ]
    },
    {
      title: 'SOP Penerimaan Barang (Goods Receipt)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      sections: [
        {
          title: 'Penerimaan & Verifikasi',
          order: 1,
          items: [
            'Terima barang dari vendor beserta Surat Jalan (SJ)',
            'Cocokkan item dan kuantitas di SJ dengan Purchase Order (PO) yang aktif di sistem',
            'Laporkan ke bagian Purchasing jika terdapat ketidaksesuaian yang signifikan'
          ]
        },
        {
          title: 'Input Goods Receipt (GR)',
          order: 2,
          items: [
            'Buka menu Goods Receipt, pilih PO yang bersangkutan',
            'Input jumlah barang yang diterima secara fisik',
            'Lakukan Quality Control (QC) dan tandai item sebagai "Passed" atau "Rejected"',
            'Submit GR untuk menambah saldo stok gudang secara otomatis'
          ]
        }
      ]
    },
    {
      title: 'SOP Pengeluaran Barang (Material Requisition)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      sections: [
        {
          title: 'Pengajuan Permintaan (MR)',
          order: 1,
          items: [
            'User/Teknisi mengajukan Material Requisition (MR) di sistem',
            'Tentukan Proyek atau Departemen peminta serta daftar barang yang dibutuhkan',
            'Pastikan jumlah yang diminta tidak melebihi alokasi proyek (jika ada)'
          ]
        },
        {
          title: 'Proses Picking & Pengeluaran',
          order: 2,
          items: [
            'Admin/Manager memberikan persetujuan (Approval) pada dokumen MR',
            'Petugas gudang menyiapkan barang (Picking) sesuai daftar di sistem',
            'Konfirmasi pengeluaran barang untuk memotong stok gudang'
          ]
        }
      ]
    },
    {
      title: 'SOP Transfer Gudang (Stock Transfer)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      sections: [
        {
          title: 'Inisiasi Pengiriman',
          order: 1,
          items: [
            'Gudang asal membuat dokumen Stock Transfer',
            'Pilih gudang tujuan dan daftar barang yang akan dipindahkan',
            'Submit untuk menandai barang dalam status "In-Transit"'
          ]
        },
        {
          title: 'Konfirmasi Penerimaan',
          order: 2,
          items: [
            'Gudang tujuan menerima barang dan memverifikasi jumlahnya',
            'Klik "Confirm Receipt" pada dokumen transfer yang bersangkutan',
            'Sistem akan otomatis menambah stok di gudang tujuan dan mengurangi stok gudang asal'
          ]
        }
      ]
    },
    {
      title: 'SOP Stock Opname (Penyesuaian Stok)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      sections: [
        {
          title: 'Persiapan Opname',
          order: 1,
          items: [
            'Pilih periode dan gudang yang akan dilakukan perhitungan fisik',
            'Nonaktifkan transaksi gudang sementara selama proses perhitungan berlangsung (Cut-off)',
            'Gunakan menu Stock Opname untuk generate daftar barang'
          ]
        },
        {
          title: 'Input Hasil & Adjustment',
          order: 2,
          items: [
            'Masukkan jumlah fisik yang dihitung secara manual ke kolom "Physical Count"',
            'Sistem akan menghitung selisih (Variance) secara otomatis',
            'Jika ada selisih, berikan catatan alasan/keterangan selisih',
            'Submit Opname untuk melakukan penyesuaian stok (Adjustment) setelah disetujui pimpinan'
          ]
        }
      ]
    },
    {
      title: 'SOP Penambahan Data Gudang',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      sections: [
        {
          title: 'Master Data Gudang',
          order: 1,
          items: [
            'Buka menu Master Data > Warehouse Management',
            'Klik "Tambah Gudang Baru"',
            'Input Kode Gudang (unik), Nama Gudang, dan Alamat Lokasi'
          ]
        },
        {
          title: 'Konfigurasi Gudang',
          order: 2,
          items: [
            'Tentukan tipe gudang: Gudang Utama (Main) atau Gudang Kerja (WIP)',
            'Aktifkan status "Active" agar gudang dapat digunakan dalam transaksi',
            'Simpan data dan verifikasi gudang muncul di dropdown transaksi inventory'
          ]
        }
      ]
    }
  ]

  console.log('Starting Inventory SOP seeding...')

  for (const sopData of inventorySOPs) {
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
          create: [{ department: { connect: { code: 'OPS' } }, isPrimary: true }]
        }
      }
    })
    console.log(`Created SOP: ${doc.title}`)
  }

  console.log('Inventory SOP seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
