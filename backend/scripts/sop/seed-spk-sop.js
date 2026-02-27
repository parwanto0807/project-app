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

  const sopTitle = 'SOP Pengelolaan Surat Perintah Kerja (SPK)'
  const existing = await prisma.document.findFirst({
    where: { title: sopTitle }
  })
  
  if (existing) {
    console.log('SOP SPK already exists')
    // Update content if needed or return
    return
  }

  const document = await prisma.document.create({
    data: {
      title: sopTitle,
      type: 'SOP',
      status: 'ACTIVE',
      version: 'FRM-SOP-SPK-001',
      content: 'Prosedur standar untuk pembuatan, pengelolaan, dan monitoring Surat Perintah Kerja (SPK).',
      createdById: admin.id,
      departments: {
        create: [
          {
            department: {
              connectOrCreate: {
                where: { code: 'OPS' },
                create: { code: 'OPS', name: 'Operations' }
              }
            },
            isPrimary: true
          }
        ]
      },
      sections: {
        create: [
          {
            title: 'I. Metode Pembuatan SPK',
            orderIndex: 0,
            content: 'Terdapat dua metode utama dalam pembuatan SPK di sistem.',
            items: {
              create: [
                { 
                  content: 'Metode Otomatis dari Sales Order: Masuk ke Menu Sales Order, pilih SO yang sudah Confirmed, klik "Buat SPK". Data item akan tersinkronisasi otomatis.', 
                  itemNumber: '1', 
                  orderIndex: 0 
                },
                { 
                  content: 'Metode Manual dari Menu SPK: Masuk ke Modul SPK, klik "Tambah SPK baru". Pilih Sales Order referensi dan masukkan detail pekerjaan secara manual.', 
                  itemNumber: '2', 
                  orderIndex: 1 
                }
              ]
            }
          },
          {
            title: 'II. Alokasi Tim dan Sumber Daya',
            orderIndex: 1,
            content: 'Menentukan pelaksana tugas.',
            items: {
              create: [
                { content: 'Pilih "Team" yang bertanggung jawab atas pekerjaan tersebut.', itemNumber: '1', orderIndex: 0 },
                { content: 'Tentukan Karyawan spesifik untuk setiap baris pekerjaan (Items) pada bagian Detail SPK.', itemNumber: '2', orderIndex: 1 },
                { content: 'Simpan dokumen SPK agar notifikasi terkirim ke tim terkait.', itemNumber: '3', orderIndex: 2 }
              ]
            }
          },
          {
            title: 'III. Monitoring Progress Kerja',
            orderIndex: 2,
            content: 'Memantau pelaksanaan pekerjaan di lapangan.',
            items: {
              create: [
                { content: 'Karyawan/PIC melaporkan kemajuan pekerjaan per item melalui Field Report.', itemNumber: '1', orderIndex: 0 },
                { content: 'Progress SPK akan dihitung secara otomatis berdasarkan rata-rata progress seluruh item (0% - 100%).', itemNumber: '2', orderIndex: 1 },
                { content: 'Gunakan filter "On Progress" atau dashboard SPK Admin untuk memantau pekerjaan yang sedang berjalan.', itemNumber: '3', orderIndex: 2 }
              ]
            }
          },
          {
            title: 'IV. Penutupan SPK (Closing)',
            orderIndex: 3,
            content: 'Tahap akhir penyelesaian tugas.',
            items: {
              create: [
                { content: 'Apabila progress mencapai 100%, sistem akan menandai SPK sebagai "Closed" secara otomatis.', itemNumber: '1', orderIndex: 0 },
                { content: 'Status Sales Order (SO) terkait akan berubah otomatis menjadi "FULFILLED" setelah SPK selesai.', itemNumber: '2', orderIndex: 1 }
              ]
            }
          }
        ]
      }
    }
  })

  console.log('SPK SOP Created:', document.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
