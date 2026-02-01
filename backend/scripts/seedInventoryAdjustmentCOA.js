import { prisma } from '../src/config/db.js';

async function main() {
  console.log('Seeding Inventory Adjustment COA...');

  // 1. Create or ensure COA exists
  // Code: 5-30001, Name: Selisih Penyesuaian Stok, Type: HPP
  const coaData = {
    code: '5-30001',
    name: 'Selisih Penyesuaian Stok',
    type: 'HPP', // Enum value from schema
    normalBalance: 'DEBIT',
    description: 'Akun untuk menampung selisih nilai inventaris saat rekonsiliasi stok opname atau tutup buku.',
    postingType: 'POSTING'
  };

  const coa = await prisma.chartOfAccounts.upsert({
    where: { code: coaData.code },
    update: {
      name: coaData.name,
      description: coaData.description,
      type: 'HPP' // Ensure up to date in case update happens
    },
    create: {
      code: coaData.code,
      name: coaData.name,
      type: 'HPP', // Correct Enum
      normalBalance: 'DEBIT',
      description: coaData.description,
      postingType: 'POSTING'
    }
  });

  console.log(`✓ COA Created/Updated: ${coa.code} - ${coa.name}`);

  // 2. Update SystemAccount
  await prisma.systemAccount.upsert({
    where: { key: 'INVENTORY_ADJUSTMENT_ACCOUNT' },
    update: {
      coaId: coa.id,
      description: 'Akun penyeimbang untuk rekonsiliasi nilai persediaan.'
    },
    create: {
      key: 'INVENTORY_ADJUSTMENT_ACCOUNT',
      coaId: coa.id,
      description: 'Akun penyeimbang untuk rekonsiliasi nilai persediaan.'
    }
  });

  console.log(`✓ SystemAccount 'INVENTORY_ADJUSTMENT_ACCOUNT' linked to ${coa.code}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
