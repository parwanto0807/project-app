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

  const sopTitle = 'SOP Pengelolaan Purchase Request (PR)'
  const existing = await prisma.document.findFirst({
    where: { title: sopTitle }
  })
  
  if (existing) {
    console.log('SOP PR already exists')
    return
  }

  const document = await prisma.document.create({
    data: {
      title: sopTitle,
      type: 'SOP',
      status: 'ACTIVE',
      version: 'FRM-SOP-PR-001',
      content: 'Prosedur standar untuk pengajuan pembelian barang dan jasa melalui Purchase Request (PR) serta otomatisasi pembuatan Purchase Order (PO).',
      createdById: admin.id,
      departments: {
        create: [
          {
            department: {
              connectOrCreate: {
                where: { code: 'PURCHASING' },
                create: { code: 'PURCHASING', name: 'Purchasing & Procurement' }
              }
            },
            isPrimary: true
          }
        ]
      },
      sections: {
        create: [
          {
            title: 'I. Klasifikasi Purchase Request (PR)',
            orderIndex: 0,
            content: 'Terdapat dua kategori PR berdasarkan tujuannya.',
            items: {
              create: [
                { 
                  content: 'PR Umum: Digunakan untuk kebutuhan stok gudang atau operasional kantor tanpa referensi SPK.', 
                  itemNumber: '1', 
                  orderIndex: 0 
                },
                { 
                  content: 'PR Project: Digunakan untuk kebutuhan material/jasa proyek yang mengacu pada SPK tertentu. Wajib menautkan Parent PR (PR UM) yang sudah Approved.', 
                  itemNumber: '2', 
                  orderIndex: 1 
                }
              ]
            }
          },
          {
            title: 'II. Prosedur Pengajuan dan Source Product',
            orderIndex: 1,
            content: 'Menentukan cara pemenuhan barang/jasa.',
            items: {
              create: [
                { content: 'Pilih "PENGAMBILAN_STOK" jika barang akan diambil dari gudang sendiri (akan menghasilkan Material Requisition).', itemNumber: '1', orderIndex: 0 },
                { content: 'Pilih "PEMBELIAN_BARANG" jika barang harus dibeli dari Supplier luar.', itemNumber: '2', orderIndex: 1 },
                { content: 'Masukkan estimasi harga dan kuantitas yang dibutuhkan secara akurat.', itemNumber: '3', orderIndex: 2 }
              ]
            }
          },
          {
            title: 'III. Verifikasi dan Otomatisasi PO',
            orderIndex: 2,
            content: 'Proses approval dan integrasi ke modul Purchasing.',
            items: {
              create: [
                { content: 'PR yang diajukan akan ditinjau oleh Admin atau PIC terkait.', itemNumber: '1', orderIndex: 0 },
                { content: 'Jika PR Umum dengan source "Pembelian Barang" disetujui (Status: APPROVED), sistem akan otomatis membuat draf Purchase Order (PO).', itemNumber: '2', orderIndex: 1 },
                { content: 'Tim Purchasing akan menerima notifikasi dan tinggal melengkapi nama Supplier serta harga final pada draf PO yang sudah terbentuk otomatis.', itemNumber: '3', orderIndex: 2 }
              ]
            }
          },
          {
            title: 'IV. Monitoring dan Kontrol',
            orderIndex: 3,
            content: 'Pemantauan status PR.',
            items: {
              create: [
                { content: 'User dapat memantau apakah PR sudah diproses menjadi PO melalui tab "Purchase Orders" pada detail PR.', itemNumber: '1', orderIndex: 0 },
                { content: 'Sistem melakukan kontrol sisa budget secara otomatis untuk memastikan pembelian tidak melebihi PR yang disetujui.', itemNumber: '2', orderIndex: 1 }
              ]
            }
          }
        ]
      }
    }
  })

  console.log('PR SOP Created:', document.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
