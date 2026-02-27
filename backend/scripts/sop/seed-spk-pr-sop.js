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

  // --- SOP SEEDING: SPK ---
  const spkTitle = 'SOP Pengelolaan Surat Perintah Kerja (SPK)'
  const existingSPK = await prisma.document.findFirst({ where: { title: spkTitle } })
  
  if (!existingSPK) {
    await prisma.document.create({
      data: {
        title: spkTitle,
        type: 'SOP',
        status: 'ACTIVE',
        version: 'FRM-SOP-SPK-001',
        content: 'Prosedur standar untuk pembuatan dan pemantauan Surat Perintah Kerja (SPK).',
        createdById: admin.id,
        departments: {
          create: [{ department: { connect: { code: 'TKN' } }, isPrimary: true }]
        },
        sections: {
          create: [
            {
              title: 'I. Metode Pembuatan SPK',
              orderIndex: 0,
              content: 'Ada dua metode utama dalam pembuatan SPK di sistem.',
              items: {
                create: [
                  { content: 'Metode Otomatis: SPK dibuat secara otomatis melalui modul Sales Order setelah SO dikonfirmasi.', itemNumber: '1', orderIndex: 0 },
                  { content: 'Metode Manual: SPK dibuat langsung melalui Menu SPK oleh admin atau kepala divisi terkait.', itemNumber: '2', orderIndex: 1 }
                ]
              }
            },
            {
              title: 'II. Kontrol dan Monitoring Progress',
              orderIndex: 1,
              content: 'Tahahpan pemantauan pengerjaan tugas.',
              items: {
                create: [
                  { content: 'Setiap teknisi wajib melakukan update status pengerjaan (In Progress, Pending, Completed).', itemNumber: '1', orderIndex: 0 },
                  { content: 'Manajemen memantau persentase kemajuan melalui dashboard Monitoring SPK.', itemNumber: '2', orderIndex: 1 }
                ]
              }
            }
          ]
        }
      }
    })
    console.log('SPK SOP Created')
  }

  // --- SOP SEEDING: Purchase Request ---
  const prTitle = 'SOP Pengajuan Pembelian (Purchase Request)'
  const existingPR = await prisma.document.findFirst({ where: { title: prTitle } })
  
  if (!existingPR) {
    await prisma.document.create({
      data: {
        title: prTitle,
        type: 'SOP',
        status: 'ACTIVE',
        version: 'FRM-SOP-PR-001',
        content: 'Prosedur pengajuan pembelian barang dan jasa perusahaan.',
        createdById: admin.id,
        departments: {
          create: [{ department: { connect: { code: 'PURCHASING' } }, isPrimary: true }]
        },
        sections: {
          create: [
            {
              title: 'I. Kategori Purchase Request',
              orderIndex: 0,
              content: 'Terdapat dua kategori PR di sistem.',
              items: {
                create: [
                  { content: 'PR Umum: Digunakan untuk kebutuhan operasional kantor sehari-hari.', itemNumber: '1', orderIndex: 0 },
                  { content: 'PR Project: Digunakan untuk kebutuhan material atau jasa spesifik pada proyek tertentu.', itemNumber: '2', orderIndex: 1 }
                ]
              }
            },
            {
              title: 'II. Alur Persetujuan dan Otomasi PO',
              orderIndex: 1,
              content: 'Prosedur verifikasi hingga menjadi PO.',
              items: {
                create: [
                  { content: 'Setiap PR harus diverifikasi oleh kepala departemen sebelum diproses oleh Purchasing.', itemNumber: '1', orderIndex: 0 },
                  { content: 'Untuk PR Umum kategori Barang, sistem akan secara otomatis menerbitkan dokumen PO (Purchase Order) setelah status disetujui.', itemNumber: '2', orderIndex: 1 }
                ]
              }
            }
          ]
        }
      }
    })
    console.log('PR SOP Created')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
