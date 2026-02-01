
import { prisma } from '../src/config/db.js';
import financialSummaryService from '../src/services/accounting/financialSummaryService.js';

async function main() {
  console.log('Fixing Existing Cash Opname JV-COP-202600001...');

  const ledgerNumber = 'JV-COP-202600001';
  const oldCoaCode = '4-10303'; // Pendapatan Lain-lain
  const newCoaCode = '3-10101'; // Saldo Awal Ekuitas

  // 1. Find Ledger
  const ledger = await prisma.ledger.findUnique({
    where: { ledgerNumber },
    include: { ledgerLines: true }
  });

  if (!ledger) {
    console.error(`❌ Ledger ${ledgerNumber} not found!`);
    process.exit(1);
  }

  console.log(`✓ Found Ledger: ${ledgerNumber} (ID: ${ledger.id})`);

  // 2. Find the Line with old COA
  // We need to resolve COA IDs first
  const oldCoa = await prisma.chartOfAccounts.findUnique({ where: { code: oldCoaCode } });
  const newCoa = await prisma.chartOfAccounts.findUnique({ where: { code: newCoaCode } });

  if (!oldCoa || !newCoa) {
    console.error('❌ COA not found');
    process.exit(1);
  }

  const lineToUpdate = ledger.ledgerLines.find(line => line.coaId === oldCoa.id);

  if (!lineToUpdate) {
    console.log(`⚠️ No LedgerLine found with COA ${oldCoaCode}. Maybe already fixed?`);
    // Check if new COA exists
    const alreadyFixed = ledger.ledgerLines.find(line => line.coaId === newCoa.id);
    if (alreadyFixed) {
        console.log(`✅ Ledger already contains the correct COA ${newCoaCode}.`);
        return;
    }
    console.error('❌ Could not identify the line to update.');
    process.exit(1);
  }

  console.log(`✓ Found Line to Update: ID ${lineToUpdate.id}, Amount: ${lineToUpdate.creditAmount} (Credit)`);

  // 3. Reverse Impact on Old COA
  // Since it was a Credit (Income), we need to DEBIT it effectively to reverse it?
  // No, `updateTrialBalance/GLSummary` takes "debitAmount" and "creditAmount" as *transaction* amounts to add.
  // To reverse a posted Credit of X, we should "post" a negative Credit of X? OR "post" a Debit of X?
  // `updateTrialBalance` increments balances. So to reverse a Credit increment, we pass negative Credit amount.
  
  await prisma.$transaction(async (tx) => {
    console.log('Reversing OLD impact...');
    
    // Reverse from TB
    await financialSummaryService.updateTrialBalance({
      periodId: ledger.periodId,
      coaId: oldCoa.id,
      debitAmount: -Number(lineToUpdate.debitAmount),
      creditAmount: -Number(lineToUpdate.creditAmount),
      tx
    });

    // Reverse from GL Summary
    await financialSummaryService.updateGeneralLedgerSummary({
      coaId: oldCoa.id,
      periodId: ledger.periodId,
      date: ledger.transactionDate,
      debitAmount: -Number(lineToUpdate.debitAmount),
      creditAmount: -Number(lineToUpdate.creditAmount),
      tx
    });

    // 4. Update LedgerLine
    console.log('Updating LedgerLine...');
    await tx.ledgerLine.update({
      where: { id: lineToUpdate.id },
      data: {
        coaId: newCoa.id,
        description: 'Cash Overage (Fixed to Equity)'
      }
    });

    // 5. Apply Impact on New COA
    console.log('Applying NEW impact...');
    await financialSummaryService.updateTrialBalance({
      periodId: ledger.periodId,
      coaId: newCoa.id,
      debitAmount: Number(lineToUpdate.debitAmount),
      creditAmount: Number(lineToUpdate.creditAmount),
      tx
    });

    await financialSummaryService.updateGeneralLedgerSummary({
      coaId: newCoa.id,
      periodId: ledger.periodId,
      date: ledger.transactionDate,
      debitAmount: Number(lineToUpdate.debitAmount),
      creditAmount: Number(lineToUpdate.creditAmount),
      tx
    });
  });

  console.log('✅ Fix applied successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
