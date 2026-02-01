
import { prisma } from '../src/config/db.js';

async function main() {
  console.log('Remapping Cash Opname System Accounts for Go-Live...');

  const equityCode = '3-10101'; // Saldo Awal Ekuitas

  // Find the Equity COA
  const equityCoa = await prisma.chartOfAccounts.findUnique({
    where: { code: equityCode }
  });

  if (!equityCoa) {
    console.error(`❌ Error: COA with code ${equityCode} not found!`);
    process.exit(1);
  }

  console.log(`✓ Found Equity Account: ${equityCoa.code} - ${equityCoa.name}`);

  const keysToUpdate = [
    { key: 'CASH_OVERAGE_ACCOUNT', desc: 'Digunakan untuk mencatat selisih lebih (overage) saat Cash Opname. Dialihkan ke Ekuitas untuk Go-Live.' },
    { key: 'CASH_SHORTAGE_ACCOUNT', desc: 'Digunakan untuk mencatat selisih kurang (shortage) saat Cash Opname. Dialihkan ke Ekuitas untuk Go-Live.' }
  ];

  for (const item of keysToUpdate) {
    const updated = await prisma.systemAccount.upsert({
      where: { key: item.key },
      update: {
        coaId: equityCoa.id,
        description: item.desc
      },
      create: {
        key: item.key,
        coaId: equityCoa.id,
        description: item.desc
      }
    });
    console.log(`✓ Updated ${item.key} -> ${equityCoa.code}`);
  }

  console.log('✅ Remapping complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
