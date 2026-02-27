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

  const userAreaSOPs = [
    {
      title: 'SOP Pelaporan Lapangan (SPK Field Report)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['TKN'], // Teknisi
      sections: [
        {
          title: 'Akses Dokumen Pekerjaan',
          order: 1,
          items: [
            'Masuk ke User Area > Monitoring Progress',
            'Sistem akan menampilkan daftar SPK yang ditugaskan kepada Anda',
            'Klik pada nomor SPK untuk melihat rincian instruksi pekerjaan'
          ]
        },
        {
          title: 'Input Laporan Harian (Field Report)',
          order: 2,
          items: [
            'Klik tombol "Lapor Progres" atau icon dokumen di baris SPK',
            'Input persentase progres masing-masing item pekerjaan',
            'Wajib mengunggah foto progres sebagai bukti pengerjaan (sebelum dan sesudah)',
            'Tuliskan catatan atau kendala di lapangan jika ada',
            'Simpan Laporan untuk diverifikasi oleh Supervisor/Admin'
          ]
        }
      ]
    },
    {
      title: 'SOP Eksekusi Pembelian Material (Purchase Execution)',
      type: 'SOP',
      version: '1.0',
      status: 'ACTIVE',
      departments: ['OPS', 'PURCHASING'], // Operasional / Purchasing
      sections: [
        {
          title: 'Persiapan Belanja',
          order: 1,
          items: [
            'Buka menu User Area > Purchase Execution',
            'Sistem akan menampilkan daftar Purchase Request (PR) yang telah disetujui (Approved)',
            'Pastikan item yang akan dibeli sesuai dengan anggaran proyek'
          ]
        },
        {
          title: 'Input Bukti Belanja & Konfirmasi',
          order: 2,
          items: [
            'Pilih PR yang akan dieksekusi, klik tombol "Execute/Belanja"',
            'Input detail harga aktual pembelian dan supplier tempat belanja',
            'Wajib mengunggah foto struk/bon/nota asli secara jelas menggunakan kamera HP',
            'Pastikan nominal di sistem sama dengan nominal di bukti fisik',
            'Submit Eksekusi agar data sinkron dengan laporan keuangan'
          ]
        }
      ]
    }
  ]

  console.log('Starting User Area SOP seeding...')

  for (const sopData of userAreaSOPs) {
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

  console.log('User Area SOP seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
