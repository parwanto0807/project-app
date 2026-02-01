import { prisma } from "../src/config/db.js";

async function forceFullRollover() {
  const janPeriodId = "e14167d7-6e0e-4d6b-9964-79b2128370dc";
  const febPeriodId = "9e831ead-3a7f-43e3-855a-a7ad11707b7f";

  console.log('--- STARTING FULL ROLLOVER (Jan -> Feb) ---');

  const coas = await prisma.chartOfAccounts.findMany({
    where: { postingType: 'POSTING' }
  });

  console.log(`Processing ${coas.length} accounts...`);

  let updatedCount = 0;

  for (const coa of coas) {
    // 1. Get Jan Ending
    const janTB = await prisma.trialBalance.findUnique({
      where: { periodId_coaId: { periodId: janPeriodId, coaId: coa.id } }
    });

    const endingDebit = Number(janTB?.endingDebit || 0);
    const endingCredit = Number(janTB?.endingCredit || 0);

    // 2. Determine Feb Opening (No Fiscal Year Reset for Jan->Feb)
    // Both are FY 2026.
    const openingDebit = endingDebit;
    const openingCredit = endingCredit;

    // 3. Upsert Feb TB
    // We must preserve existing Period Activity in Feb!
    const existingFeb = await prisma.trialBalance.findUnique({
        where: { periodId_coaId: { periodId: febPeriodId, coaId: coa.id } }
    });

    const periodDebit = Number(existingFeb?.periodDebit || 0);
    const periodCredit = Number(existingFeb?.periodCredit || 0);

    // Calculate New Ending
    const totalDebit = openingDebit + periodDebit;
    const totalCredit = openingCredit + periodCredit;
    
    let newEndingDebit = 0;
    let newEndingCredit = 0;

    if (coa.normalBalance === 'DEBIT') {
        newEndingDebit = totalDebit - totalCredit;
        if (newEndingDebit < 0) {
            newEndingCredit = Math.abs(newEndingDebit);
            newEndingDebit = 0;
        }
    } else {
        newEndingCredit = totalCredit - totalDebit;
        if (newEndingCredit < 0) {
            newEndingDebit = Math.abs(newEndingCredit);
            newEndingCredit = 0;
        }
    }

    if (existingFeb) {
        await prisma.trialBalance.update({
            where: { id: existingFeb.id },
            data: {
                openingDebit: openingDebit,
                openingCredit: openingCredit,
                endingDebit: newEndingDebit,
                endingCredit: newEndingCredit,
                calculatedAt: new Date()
            }
        });
        updatedCount++;
    } else {
        // Only create if there is a balance to carry over
        if (openingDebit > 0 || openingCredit > 0) {
            await prisma.trialBalance.create({
                data: {
                    periodId: febPeriodId,
                    coaId: coa.id,
                    openingDebit: openingDebit,
                    openingCredit: openingCredit,
                    periodDebit: 0, 
                    periodCredit: 0,
                    endingDebit: newEndingDebit,
                    endingCredit: newEndingCredit,
                    currency: 'IDR',
                    calculatedAt: new Date()
                }
            });
            updatedCount++;
        }
    }
  }

  console.log(`--- ROLLOVER COMPLETE. Updated/Created ${updatedCount} records. ---`);
}

forceFullRollover()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
