import { prisma } from '../src/config/db.js';

async function main() {
  console.log('Creating COA: 6-10102 - Beban Admin Bank...');

  // Check if already exists
  const existing = await prisma.chartOfAccounts.findUnique({
    where: { code: '6-10102' }
  });

  if (existing) {
    console.log('✓ COA 6-10102 already exists');
    return;
  }

  // Find parent account (6-10000 - Beban Operasional & Admin)
  const parent = await prisma.chartOfAccounts.findUnique({
    where: { code: '6-10000' }
  });

  if (!parent) {
    console.error('! Parent account 6-10000 not found. Please create it first.');
    process.exit(1);
  }

  // Create the new COA
  const newCOA = await prisma.chartOfAccounts.create({
    data: {
      code: '6-10102',
      name: 'Beban Admin Bank',
      description: 'Biaya administrasi bank yang ditanggung perusahaan untuk transaksi transfer, biaya kliring, biaya payment gateway, dan biaya perbankan lainnya.',
      accountType: 'BEBAN',
      normalBalance: 'DEBIT',
      level: 'POSTING',
      cashFlowType: 'OPERATING',
      isReconcilable: false,
      status: 'ACTIVE',
      parentId: parent.id
    }
  });

  console.log(`✓ Created COA: ${newCOA.code} - ${newCOA.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
