/**
 * Seed SystemAccount for Kasbon Karyawan
 * COA: 1-10303 "Piutang Karyawan Lainnya" (ASET, POSTING)
 * Run: node seed_kasbon_system_account.js
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find COA 1-10303
  const coa = await prisma.chartOfAccounts.findFirst({
    where: { code: '1-10303' }
  });

  if (!coa) {
    console.error('❌ COA 1-10303 (Piutang Karyawan Lainnya) not found!');
    process.exit(1);
  }

  const result = await prisma.systemAccount.upsert({
    where: { key: 'EMPLOYEE_CASH_ADVANCE' },
    update: {
      description: 'Digunakan untuk mencatat piutang kasbon (cash advance) karyawan. Akun ini di-Debit saat kasbon dicairkan dan di-Kredit saat kasbon dilunasi via potong gaji.',
      coaId: coa.id,
    },
    create: {
      key: 'EMPLOYEE_CASH_ADVANCE',
      description: 'Digunakan untuk mencatat piutang kasbon (cash advance) karyawan. Akun ini di-Debit saat kasbon dicairkan dan di-Kredit saat kasbon dilunasi via potong gaji.',
      coaId: coa.id,
    },
  });

  ;(() => {})('✅ SystemAccount EMPLOYEE_CASH_ADVANCE upserted:');
  ;(() => {})(`   Key  : ${result.key}`);
  ;(() => {})(`   COA  : ${coa.code} - ${coa.name}`);
  ;(() => {})(`   Type : ${coa.type}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
