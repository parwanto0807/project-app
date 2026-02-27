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

  const adminFinanceSOPs = [
    {
      title: 'SOP Pembuatan Penawaran (Quotation)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['SALES'],
      sections: [
        {
          title: 'Input Data Penawaran',
          order: 1,
          items: [
            'Buka menu Sales > Quotation > Create New',
            'Pilih Customer dari daftar master, pastikan alamat penagihan sudah benar',
            'Input item barang/jasa, kuantitas, dan harga sesuai kesepakatan atau daftar harga',
            'Tentukan PPN (Tax) dan diskon jika ada'
          ]
        },
        {
          title: 'Finalisasi & Pengiriman',
          order: 2,
          items: [
            'Simpan Quotation dan sistem akan memberikan nomor otomatis',
            'Cetak atau Export ke PDF untuk dikirimkan ke Customer',
            'Update status menjadi "Sent" setelah dokumen diterima customer'
          ]
        }
      ]
    },
    {
      title: 'SOP Berita Acara Pekerjaan (BAP)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['OPS'],
      sections: [
        {
          title: 'Verifikasi Penyelesaian Kerja',
          order: 1,
          items: [
            'Pastikan pekerjaan lapangan telah selesai (berdasarkan SPK Report)',
            'Siapkan rincian pekerjaan yang telah diselesaikan secara fisik',
            'Buka menu Logistic > BAP > Create New'
          ]
        },
        {
          title: 'Pembuatan Dokumen BAP',
          order: 2,
          items: [
            'Pilih Proyek/SPK yang bersangkutan',
            'Input detail volume atau progres pekerjaan yang akan di-BAP-kan',
            'Submit BAP agar dapat diproses oleh bagian Finance untuk penagihan/Invoice'
          ]
        }
      ]
    },
    {
      title: 'SOP Penagihan Customer (Invoice)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['FIN'],
      sections: [
        {
          title: 'Penerbitan Invoice',
          order: 1,
          items: [
            'Buka menu Finance > Invoice > Create',
            'Pilih sumber dokumen penagihan (Quotation atau BAP)',
            'Sistem akan menarik data item dan nominal secara otomatis',
            'Pastikan syarat pembayaran (Term of Payment) sudah tepat'
          ]
        },
        {
          title: 'Monitoring Piutang',
          order: 2,
          items: [
            'Kirimkan Invoice ke Customer beserta lampiran pendukung (BAP/SJ)',
            'Update tanggal kirim invoice di sistem untuk tracking jatuh tempo',
            'Pantau status pembayaran apakah sudah Lunas (Paid) atau masih Open'
          ]
        }
      ]
    },
    {
      title: 'SOP Transfer Dana Kas/Bank (Fund Transfer)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['FIN'],
      sections: [
        {
          title: 'Inisiasi Transfer',
          order: 1,
          items: [
            'Buka menu Finance > Fund Transfer',
            'Pilih Kas/Bank Asal (Source) dan Kas/Bank Tujuan (Destination)',
            'Input nominal transfer dan biaya admin bank (japa ada)'
          ]
        },
        {
          title: 'Rekonsiliasi',
          order: 2,
          items: [
            'Input berita/keterangan transfer untuk keperluan audit',
            'Submit transaksi dan pastikan saldo di kedua akun kas/bank terupdate dengan benar',
            'Lampirkan bukti transfer bank di sistem jika diperlukan'
          ]
        }
      ]
    },
    {
      title: 'SOP Biaya Operasional (Operational Expenses)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['FIN'],
      sections: [
        {
          title: 'Pencatatan Biaya',
          order: 1,
          items: [
            'Buka menu Finance > Operational Expenses',
            'Pilih kategori biaya (PLN, Telepon, Bensin, ATK, dll)',
            'Input nominal pengeluaran dan tanggal transaksi fisik'
          ]
        },
        {
          title: 'Dokumentasi & Kas',
          order: 2,
          items: [
            'Pilih akun Kas/Bank yang digunakan untuk membayar',
            'Input keterangan detail peruntukan biaya',
            'Submit untuk memotong saldo kas dan mencatat beban di laporan laba rugi'
          ]
        }
      ]
    },
    {
      title: 'SOP Pembayaran Supplier (Supplier Payment)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['FIN'],
      sections: [
        {
          title: 'Verifikasi Tagihan Supplier',
          order: 1,
          items: [
            'Terima Invoice dari Supplier (berdasarkan PO/GR perusahaan)',
            'Pastikan nominal tagihan sesuai dengan barang/jasa yang diterima (Matching 3-way)',
            'Buka menu Accounting > Supplier Payment'
          ]
        },
        {
          title: 'Eksekusi Pembayaran',
          order: 2,
          items: [
            'Pilih Invoice Supplier yang akan dibayarkan',
            'Input jumlah bayar (Full atau Partial)',
            'Pilih sumber dana pembayaran (Bank/Kas)',
            'Submit transaksi untuk menandai Invoice Supplier sebagai "Paid"'
          ]
        }
      ]
    },
    {
      title: 'SOP Persetujuan Pembelian (PR Approval)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['DRO', 'FIN'], 
      sections: [
        {
          title: 'Review Permintaan',
          order: 1,
          items: [
            'Buka menu Finance > PR Approval',
            'Tinjau daftar Purchase Request (PR) yang berstatus "Request"',
            'Periksa urgensi barang dan ketersediaan anggaran (Budget Check)'
          ]
        },
        {
          title: 'Keputusan Approval',
          order: 2,
          items: [
            'Klik tombol "Approve" jika permintaan disetujui, atau "Reject" jika ditolak dengan alasan',
            'PR yang disetujui akan otomatis lanjut ke bagian Purchasing untuk diproses menjadi PO',
            'Sistem akan mengirim notifikasi ke peminta awal terkait status PR tersebut'
          ]
        }
      ]
    }
  ]

  console.log('Starting Admin & Finance SOP seeding...')

  for (const sopData of adminFinanceSOPs) {
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

  console.log('Admin & Finance SOP seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
