/**
 * Script: addMealAllowanceSystemAccount.js
 * 
 * Menambahkan SystemAccount untuk modul Meal Allowance:
 * - EXPENSE_MEAL_ALLOWANCE : Akun Biaya Uang Makan (DEBIT saat posting)
 * 
 * Sekaligus memperbaiki controller agar tidak pakai coaGajiPokok/coaKasBankDefault
 * yang tidak ada di schema, melainkan pakai SystemAccount pattern.
 * 
 * Juga menggunakan CASH_BANK (yang sudah ada) untuk sisi Kredit.
 */

import { prisma } from '../src/config/db.js';

async function main() {
  console.log('=== Menambahkan SystemAccount untuk Meal Allowance ===\n');

  // 1. Cek SystemAccount yang sudah ada
  const existing = await prisma.systemAccount.findMany({
    include: { coa: { select: { code: true, name: true, postingType: true } } }
  });
  console.log(`SystemAccount yang sudah ada (${existing.length}):`);
  for (const sa of existing) {
    console.log(`  [${sa.key}] => ${sa.coa?.code} - ${sa.coa?.name} (${sa.coa?.postingType})`);
  }
  console.log('');

  // 2. Cek apakah EXPENSE_MEAL_ALLOWANCE sudah ada
  const mealAllowanceKey = 'EXPENSE_MEAL_ALLOWANCE';
  const existingMealAllowance = existing.find(sa => sa.key === mealAllowanceKey);
  if (existingMealAllowance) {
    console.log(`✅ SystemAccount '${mealAllowanceKey}' sudah ada:`);
    console.log(`   => ${existingMealAllowance.coa?.code} - ${existingMealAllowance.coa?.name}`);
    console.log('');
  }

  // 3. Cek CASH_BANK (untuk sisi kredit)
  const cashBank = existing.find(sa => sa.key === 'CASH_BANK');
  console.log(`SystemAccount CASH_BANK (untuk sisi kredit):`);
  if (cashBank) {
    console.log(`  ✅ Ada => ${cashBank.coa?.code} - ${cashBank.coa?.name}`);
  } else {
    console.log(`  ❌ Belum ada!`);
  }
  console.log('');

  // 4. Cari COA yang cocok untuk Biaya Uang Makan
  // Coba urutan prioritas: nama khusus, lalu fallback ke beban gaji/operasional
  const searchPatterns = [
    { name: 'Beban Uang Makan' },
    { name: 'Tunjangan Makan' },
    { name: 'Uang Makan' },
    { name: 'Beban Tunjangan' },
    { name: 'Beban Gaji & Honorarium' },
    { name: 'Beban Gaji Karyawan' },
  ];

  let targetCoa = null;
  for (const pattern of searchPatterns) {
    targetCoa = await prisma.chartOfAccounts.findFirst({
      where: {
        name: { contains: pattern.name, mode: 'insensitive' },
        postingType: 'POSTING',
        status: 'ACTIVE'
      }
    });
    if (targetCoa) {
      console.log(`✅ COA ditemukan untuk "${pattern.name}": ${targetCoa.code} - ${targetCoa.name}`);
      break;
    }
  }

  if (!targetCoa) {
    // Fallback: Lihat semua COA dengan tipe BEBAN yang POSTING
    console.log('⚠️  Tidak ditemukan COA khusus untuk uang makan. Mencari COA Beban yang tersedia...\n');
    const bebanCoas = await prisma.chartOfAccounts.findMany({
      where: {
        type: 'BEBAN',
        postingType: 'POSTING',
        status: 'ACTIVE'
      },
      orderBy: { code: 'asc' },
      take: 20
    });
    console.log('COA Beban (POSTING) yang tersedia:');
    for (const coa of bebanCoas) {
      console.log(`  ${coa.code} - ${coa.name}`);
    }

    // Gunakan COA pertama yang ada (misalnya Beban Gaji)
    if (bebanCoas.length > 0) {
      // Pilih yang paling relevan (kemungkinan besar ada Beban Gaji di urutan pertama)
      targetCoa = bebanCoas.find(c => 
        c.name.toLowerCase().includes('gaji') ||
        c.name.toLowerCase().includes('karyawan') ||
        c.name.toLowerCase().includes('personalia')
      ) || bebanCoas[0];
      console.log(`\n➡️  Akan menggunakan: ${targetCoa.code} - ${targetCoa.name}`);
    }
  }

  if (!targetCoa) {
    console.error('❌ Tidak ada COA yang cocok! Harap buat COA "Beban Uang Makan" terlebih dahulu di menu Chart of Accounts.');
    process.exit(1);
  }

  // 5. Upsert SystemAccount EXPENSE_MEAL_ALLOWANCE
  if (!existingMealAllowance) {
    console.log(`\n⏳ Menambahkan SystemAccount '${mealAllowanceKey}'...`);
    const created = await prisma.systemAccount.upsert({
      where: { key: mealAllowanceKey },
      update: {
        coaId: targetCoa.id,
        description: 'Digunakan untuk mencatat beban uang makan karyawan. Akun ini di-Debit saat pencairan uang makan di-posting.'
      },
      create: {
        key: mealAllowanceKey,
        coaId: targetCoa.id,
        description: 'Digunakan untuk mencatat beban uang makan karyawan. Akun ini di-Debit saat pencairan uang makan di-posting.'
      }
    });
    console.log(`✅ SystemAccount '${mealAllowanceKey}' berhasil dibuat!`);
    console.log(`   => ${targetCoa.code} - ${targetCoa.name}`);
  } else {
    console.log(`ℹ️  SystemAccount '${mealAllowanceKey}' sudah ada, skip.`);
  }

  // 6. Konfirmasi akhir
  console.log('\n=== Hasil Akhir ===');
  const finalCheck = await prisma.systemAccount.findMany({
    where: { key: { in: [mealAllowanceKey, 'CASH_BANK', 'EXPENSE_SALARY'] } },
    include: { coa: { select: { code: true, name: true, postingType: true } } }
  });
  for (const sa of finalCheck) {
    const status = sa.coa?.postingType === 'POSTING' ? '✅' : '⚠️ HEADER!';
    console.log(`  ${status} [${sa.key}] => ${sa.coa?.code} - ${sa.coa?.name}`);
  }

  const hasMealAllowance = finalCheck.find(sa => sa.key === mealAllowanceKey);
  const hasCashBank = finalCheck.find(sa => sa.key === 'CASH_BANK');

  console.log('\n=== Status Siap untuk Meal Allowance Posting ===');
  console.log(`  EXPENSE_MEAL_ALLOWANCE (Debit): ${hasMealAllowance ? '✅' : '❌ BELUM ADA'}`);
  console.log(`  CASH_BANK (Kredit):             ${hasCashBank ? '✅' : '❌ BELUM ADA'}`);

  if (hasMealAllowance && hasCashBank) {
    console.log('\n🎉 Konfigurasi lengkap! Controller Meal Allowance perlu diupdate untuk pakai SystemAccount.');
  } else {
    console.log('\n⚠️  Ada konfigurasi yang kurang, cek output di atas.');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
