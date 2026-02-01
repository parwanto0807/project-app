import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkGeneralLedgerSummary() {
    try {
        console.log('='.repeat(70));
        console.log('GENERAL LEDGER SUMMARY - CLOSING VERIFICATION');
        console.log('='.repeat(70));

        // Get accounting periods for Jan and Feb 2026
        const janPeriod = await prisma.accountingPeriod.findFirst({
            where: { periodCode: '012026' }
        });

        const febPeriod = await prisma.accountingPeriod.findFirst({
            where: { periodCode: '022026' }
        });

        if (!janPeriod) {
            console.log('\n❌ January 2026 period not found');
            return;
        }

        console.log(`\n📅 JANUARY 2026:`);
        console.log(`   Period: ${janPeriod.periodName}`);
        console.log(`   Status: ${janPeriod.isClosed ? '🔒 CLOSED' : '🔓 OPEN'}`);
        if (janPeriod.closedAt) {
            console.log(`   Closed At: ${janPeriod.closedAt.toISOString()}`);
        }

        // Count GL Summary records for January
        const janGLCount = await prisma.generalLedgerSummary.count({
            where: { periodId: janPeriod.id }
        });

        console.log(`   GL Summary Records: ${janGLCount}`);

        if (febPeriod) {
            console.log(`\n📅 FEBRUARY 2026:`);
            console.log(`   Period: ${febPeriod.periodName}`);
            console.log(`   Status: ${febPeriod.isClosed ? '🔒 CLOSED' : '🔓 OPEN'}`);

            const febGLCount = await prisma.generalLedgerSummary.count({
                where: { periodId: febPeriod.id }
            });

            console.log(`   GL Summary Records: ${febGLCount}`);

            if (febGLCount > 0) {
                // Sample Feb GL records
                const febSamples = await prisma.generalLedgerSummary.findMany({
                    where: { periodId: febPeriod.id },
                    take: 5,
                    include: {
                        coa: {
                            select: {
                                accountCode: true,
                                accountName: true
                            }
                        }
                    }
                });

                console.log(`\n   Sample Records:`);
                febSamples.forEach((gl, i) => {
                    console.log(`   ${i + 1}. ${gl.coa.accountCode} - ${gl.coa.accountName}`);
                    console.log(`      Beginning: Rp ${Number(gl.beginningBalance || 0).toLocaleString('id-ID')}`);
                    console.log(`      Ending:    Rp ${Number(gl.endingBalance || 0).toLocaleString('id-ID')}`);
                });
            }
        } else {
            console.log(`\n⚠️  February 2026 period not found`);
        }

        // Check Trial Balance
        console.log(`\n${'='.repeat(70)}`);
        console.log('TRIAL BALANCE RECORDS');
        console.log('='.repeat(70));

        const janTBCount = await prisma.trialBalance.count({
            where: { periodId: janPeriod.id }
        });

        console.log(`\n� JANUARY Trial Balance: ${janTBCount} records`);

        if (febPeriod) {
            const febTBCount = await prisma.trialBalance.count({
                where: { periodId: febPeriod.id }
            });

            console.log(`📊 FEBRUARY Trial Balance: ${febTBCount} records`);
        }

        console.log(`\n${'='.repeat(70)}`);
        console.log('✅ Verification Complete');
        console.log('='.repeat(70));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

checkGeneralLedgerSummary();
