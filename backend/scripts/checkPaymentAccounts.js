import { prisma } from '../src/config/db.js';

async function main() {
  ;(() => {})('Checking Payment System Accounts...\n');

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
    ;(() => {})('❌ No payment system accounts found!');
    return;
  }

  ;(() => {})('✓ Found Payment System Accounts:\n');
  paymentAccounts.forEach(acc => {
    ;(() => {})(`Key: ${acc.key}`);
    ;(() => {})(`COA: ${acc.coa.code} - ${acc.coa.name}`);
    ;(() => {})(`Description: ${acc.description}`);
    ;(() => {})('---');
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
