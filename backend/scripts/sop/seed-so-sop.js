import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin', active: true }
  })
  
  if (!admin) {
    console.error('No admin found')
    return
  }
  
  console.log('Using admin:', admin.email)

  const sopTitle = 'SOP Pengelolaan Sales Order'
  const existing = await prisma.document.findFirst({
    where: { title: sopTitle }
  })
  
  if (existing) {
    console.log('SOP already exists')
    // Update content just in case
    return
  }

  const document = await prisma.document.create({
    data: {
      title: sopTitle,
      type: 'SOP',
      status: 'ACTIVE',
      version: 'FRM-SOP-SO-001',
      content: 'Prosedur standar untuk mengelola Sales Order mulai dari pembuatan hingga penagihan.',
      createdById: admin.id,
      departments: {
        create: [
          {
            department: {
              connectOrCreate: {
                where: { code: 'SALES' },
                create: { code: 'SALES', name: 'Sales & Marketing' }
              }
            },
            isPrimary: true
          }
        ]
      },
      sections: {
        create: [
          {
            title: 'I. Persiapan dan Input Data',
            orderIndex: 0,
            content: 'Tahap awal sebelum membuat Sales Order.',
            items: {
              create: [
                { content: 'Pastikan data Master Customer dan Master Project sudah terdaftar dan aktif.', itemNumber: '1', orderIndex: 0 },
                { content: 'Verifikasi spesifikasi produk atau jasa yang dipesan oleh pelanggan.', itemNumber: '2', orderIndex: 1 }
              ]
            }
          },
          {
            title: 'II. Langkah-langkah Pembuatan SO',
            orderIndex: 1,
            content: 'Proses input data ke dalam sistem.',
            items: {
              create: [
                { content: 'Masuk ke Modul Sales Order dan klik "Tambah Sales Order".', itemNumber: '1', orderIndex: 0 },
                { content: 'Pilih Nama Pelanggan dan Proyek terkait.', itemNumber: '2', orderIndex: 1 },
                { content: 'Masukkan item pesanan (Produk/Jasa) beserta qty dan harga yang disepakati.', itemNumber: '3', orderIndex: 2 },
                { content: 'Berikan diskon jika ada dan pastikan perhitungan pajak (PPN) sudah sesuai.', itemNumber: '4', orderIndex: 3 }
              ]
            }
          },
          {
            title: 'III. Finalisasi dan Persetujuan',
            orderIndex: 2,
            content: 'Penyelesaian dokumen SO.',
            items: {
              create: [
                { content: 'Tambahkan catatan tambahan jika diperlukan pada kolom Notes.', itemNumber: '1', orderIndex: 0 },
                { content: 'Simpan dokumen sebagai Draft untuk ditinjau atau langsung Confirmed jika sudah final.', itemNumber: '2', orderIndex: 1 }
              ]
            }
          },
          {
            title: 'IV. Monitoring dan Tindak Lanjut',
            orderIndex: 3,
            content: 'Tahap setelah SO berhasil diterbitkan.',
            items: {
              create: [
                { content: 'Pantau status pemenuhan (Fulfilled) melalui dashboard.', itemNumber: '1', orderIndex: 0 },
                { content: 'Sales Order dilanjutkan ke pembuatan SPK untuk tim teknis atau penagihan (Invoice) untuk tim keuangan.', itemNumber: '2', orderIndex: 1 }
              ]
            }
          }
        ]
      }
    }
  })

  console.log('SOP Created:', document.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
