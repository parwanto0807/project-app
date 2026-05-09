import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedLoanAccount() {
  try {
    // 1. Find parent
    const parent = await prisma.chartOfAccounts.findFirst({
      where: { code: '1-10300' }
    });

    if (!parent) {
      console.error('Parent account 1-10300 not found');
      return;
    }

    // 2. Create COA Piutang Karyawan
    const coa = await prisma.chartOfAccounts.upsert({
      where: { code: '1-10305' },
      update: {},
      create: {
        code: '1-10305',
        name: 'Piutang Karyawan',
        description: 'Akun untuk mencatat pinjaman dan piutang kepada karyawan.',
        type: 'ASET',
        normalBalance: 'DEBIT',
        postingType: 'POSTING',
        cashflowType: 'INVESTING',
        status: 'ACTIVE',
        parentId: parent.id
      }
    });

    // 3. Create SystemAccount mapping
    await prisma.systemAccount.upsert({
      where: { key: 'EMPLOYEE_LOAN_ACCOUNT' },
      update: { coaId: coa.id },
      create: {
        key: 'EMPLOYEE_LOAN_ACCOUNT',
        description: 'Digunakan untuk mencatat piutang pinjaman karyawan.',
        coaId: coa.id
      }
    });

    console.log('✅ Employee Loan Account seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding loan account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLoanAccount();
