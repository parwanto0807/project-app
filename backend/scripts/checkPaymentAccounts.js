import { prisma } from '../src/config/db.js';

async function main() {
  console.log('Checking Payment System Accounts...\n');

  const paymentAccounts = await prisma.systemAccount.findMany({
    where: {
      key: {
        in: ['PAYMENT_RECEIVABLE_ACCOUNT', 'PAYMENT_BANK_CHARGE_EXPENSE']
      }
    },
    include: {
      coa: true
    }
  });

  if (paymentAccounts.length === 0) {
    console.log('❌ No payment system accounts found!');
    return;
  }

  console.log('✓ Found Payment System Accounts:\n');
  paymentAccounts.forEach(acc => {
    console.log(`Key: ${acc.key}`);
    console.log(`COA: ${acc.coa.code} - ${acc.coa.name}`);
    console.log(`Description: ${acc.description}`);
    console.log('---');
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
