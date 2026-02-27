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

  const accountingSOPs = [
    {
      title: 'SOP Verifikasi Pembelian (PR Verify)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR'],
      sections: [
        {
          title: 'Tinjauan Akun & Anggaran',
          order: 1,
          items: [
            'Buka menu Accounting > PR Verify',
            'Lihat detail Purchase Request (PR) yang telah disetujui (Approved) oleh Direksi',
            'Pastikan pemetaan akun biaya (COA) sudah sesuai dengan jenis barang yang dibeli'
          ]
        },
        {
          title: 'Verifikasi Akhir',
          order: 2,
          items: [
            'Berikan tanda centang verifikasi jika dokumen pendukung dan akun sudah benar',
            'PR yang terverifikasi akan berstatus "Verified" dan siap diproses menjadi Purchase Order (PO)',
            'Jika ada kesalahan akun, lakukan koreksi sebelum verifikasi'
          ]
        }
      ]
    },
    {
      title: 'SOP Saldo Staff (Staff Balance/Settlement)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR'],
      sections: [
        {
          title: 'Pemberian Kasbon (Advance)',
          order: 1,
          items: [
            'Catat pemberian dana awal ke staff melalui menu Staff Balance',
            'Input nominal dan tujuan penggunaan dana (operasional/proyek)',
            'Status akan tercatat sebagai hutang staff (Account Receivable Staff)'
          ]
        },
        {
          title: 'Penyelesaian (Settlement)',
          order: 2,
          items: [
            'Terima bukti pengeluaran riil dari staff',
            'Input rincian pengeluaran pada menu Settlement',
            'Sistem akan menghitung selisih: Kurang Bayar (staff mengembalikan) atau Lebih Bayar (perusahaan mengganti)',
            'Pastikan saldo staff kembali menjadi nol setelah settlement selesai'
          ]
        }
      ]
    },
    {
      title: 'SOP Tagihan Masuk (Supplier Invoice)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR'],
      sections: [
        {
          title: 'Registrasi Invoice',
          order: 1,
          items: [
            'Terima fisik/digital invoice dari supplier',
            'Pilih Purchase Order (PO) atau Goods Receipt (GR) yang bersangkutan',
            'Input nomor invoice supplier, tanggal tagihan, dan tanggal jatuh tempo'
          ]
        },
        {
          title: 'Validasi Nilai',
          order: 2,
          items: [
            'Pastikan nilai tagihan di sistem sama dengan nilai di fisik invoice (termasuk pajak)',
            'Simpan data untuk membentuk saldo Hutang Usaha (Account Payable)',
            'Siapkan dokumen untuk proses pembayaran oleh Finance'
          ]
        }
      ]
    },
    {
      title: 'SOP Monitoring Buku Pembantu (Ledger)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR', 'FIN'],
      sections: [
        {
          title: 'Pencarian Transaksi Akun',
          order: 1,
          items: [
            'Buka menu Accounting > Ledger',
            'Pilih akun COA tertentu (misal: Kas atau Bank)',
            'Tentukan periode tanggal untuk melihat rincian mutasi'
          ]
        },
        {
          title: 'Analisis Detail',
          order: 2,
          items: [
            'Periksa satu per satu jurnal yang masuk ke akun tersebut',
            'Gunakan fitur export untuk keperluan audit atau rekonsiliasi eksternal (misal: Rekening Koran)'
          ]
        }
      ]
    },
    {
      title: 'SOP Buku Besar Utama (General Ledger)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR'],
      sections: [
        {
          title: 'Pemantauan Seluruh Jurnal',
          order: 1,
          items: [
            'Buka menu Accounting > General Ledger',
            'Monitoring seluruh jurnal otomatis yang dihasilkan sistem (sales, purchasing, expenses)',
            'Pastikan tidak ada jurnal yang menggantung atau tidak seimbang (Unbalanced)'
          ]
        }
      ]
    },
    {
      title: 'SOP Neraca Saldo (Trial Balance)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR'],
      sections: [
        {
          title: 'Verifikasi Keseimbangan Akun',
          order: 1,
          items: [
            'Buka menu Accounting > Trial Balance pada akhir periode (bulan/tahun)',
            'Pastikan total Debit dan Kredit sama besar (Synchronized)',
            'Identifikasi akun yang memiliki saldo tidak wajar untuk dilakukan koreksi'
          ]
        }
      ]
    },
    {
      title: 'SOP Laporan Laba Rugi (Profit & Loss)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR', 'DRO'],
      sections: [
        {
          title: 'Analisis Kinerja Keuangan',
          order: 1,
          items: [
            'Buka menu Accounting > Financial Reports',
            'Pilih periode Laporan Laba Rugi',
            'Pantau total pendapatan dibandingkan dengan total biaya operasional dan HPP',
            'Evaluasi margin keuntungan perusahaan secara real-time'
          ]
        }
      ]
    },
    {
      title: 'SOP Laporan Neraca (Balance Sheet)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR', 'DRO'],
      sections: [
        {
          title: 'Struktur Aset & Kewajiban',
          order: 1,
          items: [
            'Akses menu Balance Sheet dengan menentukan tanggal akhir periode',
            'Pantau nilai Aset (Lancar & Tetap) harus sama dengan Liabilitas + Ekuitas',
            'Gunakan laporan ini untuk melihat kesehatan finansial perusahaan jangka panjang'
          ]
        }
      ]
    },
    {
      title: 'SOP Laporan Arus Kas (Cash Flow)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR', 'FIN'],
      sections: [
        {
          title: 'Aliran Uang Masuk & Keluar',
          order: 1,
          items: [
            'Buka menu Cash Flow, tentukan periode awal dan akhir',
            'Analisis pergerakan kas dari aktivitas Operasional, Investasi, dan Pendanaan',
            'Pastikan ketersediaan uang tunai cukup untuk membiayai operasional kedepan'
          ]
        }
      ]
    },
    {
      title: 'SOP Pengaturan Bagan Akun (Master COA)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR'],
      sections: [
        {
          title: 'Manajemen Akun Akuntansi',
          order: 1,
          items: [
            'Buka Master Data > COA',
            'Tambah atau Edit akun baru dengan memperhatikan Kode, Nama, dan Tipe Akun (Asset/Liability/Equity/Income/Expense)',
            'Tentukan Header/Parent akun untuk keperluan grouping laporan keuangan'
          ]
        }
      ]
    },
    {
      title: 'SOP Periode Akuntansi (Accounting Period)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR'],
      sections: [
        {
          title: 'Kontrol Transaksi Bulanan',
          order: 1,
          items: [
            'Akses menu Accounting Period',
            'Lakukan "Close Period" untuk bulan yang sudah selesai diaudit agar tidak ada input data susulan',
            'Buka periode baru untuk memulai transaksi bulan berikutnya'
          ]
        }
      ]
    },
    {
      title: 'SOP Rekonsiliasi Kas (Cash Opname)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR', 'FIN'],
      sections: [
        {
          title: 'Perhitungan Fisik Uang',
          order: 1,
          items: [
            'Hitung fisik uang tunai di brankas secara manual',
            'Buka menu Cash Opname, pilih akun Kas yang akan diopname',
            'Input jumlah fisik per keping/lembar mata uang'
          ]
        },
        {
          title: 'Adjustment Selisih',
          order: 2,
          items: [
            'Sistem membandingkan saldo buku dengan saldo fisik',
            'Jika ada selisih wajar, lakukan adjustment ke akun selisih kas setelah disetujui'
          ]
        }
      ]
    },
    {
      title: 'SOP Aset Tetap (Fixed Asset)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['HR'],
      sections: [
        {
          title: 'Registrasi & Penyusutan',
          order: 1,
          items: [
            'Daftarkan aset baru (kendaraan, gedung, alat kantor) pada menu Fixed Asset',
            'Input nilai perolehan, masa manfaat, dan metode penyusutan',
            'Sistem akan otomatis menghitung beban penyusutan (Depreciation) setiap bulan'
          ]
        },
        {
          title: 'Tracking Aset',
          order: 2,
          items: [
            'Update lokasi atau penanggung jawab aset jika ada perpindahan',
            'Nonaktifkan aset (Disposal) jika sudah dijual atau rusak melalui sistem'
          ]
        }
      ]
    }
  ]

  console.log('Starting Accounting & Master SOP seeding...')

  for (const sopData of accountingSOPs) {
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
          create: sopData.departments.map(dCode => ({
            department: { connect: { code: dCode } },
            isPrimary: true
          }))
        }
      }
    })
    console.log(`Created SOP: ${doc.title}`)
  }

  console.log('Accounting & Master SOP seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
