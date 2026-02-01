import { prisma } from '../src/config/db.js';

/**
 * MASTER SETUP INVENTORY
 * Run this after DB Reset/Restore to ensure Closing process works automatically.
 */
async function main() {
  console.log('--- START MASTER SETUP INVENTORY ---');

  // 1. Setup Adjustment Account & Mapping
  console.log('1/2. Setting up INVENTORY_ADJUSTMENT_ACCOUNT...');
  const adjCoaData = {
    code: '5-30001',
    name: 'Selisih Penyesuaian Stok',
    type: 'HPP',
    normalBalance: 'DEBIT',
    description: 'Akun untuk rekonsiliasi nilai inventaris (Sub-ledger vs GL).',
    postingType: 'POSTING'
  };

  const adjCoa = await prisma.chartOfAccounts.upsert({
    where: { code: adjCoaData.code },
    update: { name: adjCoaData.name },
    create: adjCoaData
  });

  await prisma.systemAccount.upsert({
    where: { key: 'INVENTORY_ADJUSTMENT_ACCOUNT' },
    update: { coaId: adjCoa.id },
    create: { 
        key: 'INVENTORY_ADJUSTMENT_ACCOUNT', 
        coaId: adjCoa.id, 
        description: 'Akun penyeimbang untuk rekonsiliasi nilai persediaan.'
    }
  });
  console.log(`✓ Adjustment Account mapped to ${adjCoa.code}`);

  // 2. Link Warehouses to COA
  console.log('2/2. Linking Warehouses to COA...');
  const coaMap = {
    'GUDANG BENGKEL': '1-10202',
    'GUDANG KEBON': '1-10203',
    'GUDANG B ZHAENAL': '1-10204',
    'GUDANG WIP PROJECT ': '1-10205'
  };

  for (const [whName, coaCode] of Object.entries(coaMap)) {
    const coa = await prisma.chartOfAccounts.findFirst({
      where: { code: coaCode }
    });

    if (coa) {
      const res = await prisma.warehouse.updateMany({
        where: { name: whName },
        data: { inventoryAccountId: coa.id }
      });
      if (res.count > 0) {
        console.log(`✓ Linked Warehouse '${whName}' to account ${coaCode}`);
      } else {
        console.log(`! Warehouse '${whName}' NOT FOUND in database. Skipping.`);
      }
    } else {
      console.log(`✕ COA '${coaCode}' NOT FOUND in database. Skipping.`);
    }
  }

  console.log('--- SETUP COMPLETE ---');
  console.log('Closing process will now automatically synchronize Stock vs GL.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
