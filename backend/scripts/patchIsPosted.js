/**
 * Script: patchIsPosted.js
 * Patch data PencairanUangMakan yang statusnya POSTED tapi isPosted masih false
 * (data lama sebelum field isPosted ditambahkan)
 */
import { prisma } from '../src/config/db.js';

async function main() {
  console.log('Patching isPosted for existing POSTED records...');

  const result = await prisma.pencairanUangMakan.updateMany({
    where: {
      status: 'POSTED',
      isPosted: false
    },
    data: {
      isPosted: true
    }
  });

  console.log(`✅ Updated ${result.count} records dengan isPosted = true`);

  // Juga patch PUBLISHED yang sudah pernah di-post (jika ada)
  // PUBLISHED yang lahir dari alur: POSTED → Publish = sudah pernah di-post
  // Namun kita tidak bisa tahu dari status saja, hanya bisa dari yang baru
  // Untuk data lama PUBLISHED, kita perlu manual review
  // Untuk saat ini, hanya patch yang status POSTED saja

  const remaining = await prisma.pencairanUangMakan.findMany({
    where: { isPosted: false },
    select: { id: true, status: true, karyawan: { select: { namaLengkap: true } }, periodeBulan: true, siklus: true }
  });

  console.log(`\nData yang isPosted = false (${remaining.length}):`);
  for (const r of remaining) {
    console.log(`  [${r.status}] ${r.karyawan.namaLengkap} - ${r.periodeBulan} Siklus ${r.siklus}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
