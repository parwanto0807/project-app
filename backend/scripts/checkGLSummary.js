import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function checkGeneralLedgerSummary() {
    try {
        (() => {})('='.repeat(70));
        (() => {})('GENERAL LEDGER SUMMARY - CLOSING VERIFICATION');
        (() => {})('='.repeat(70));

        // Get accounting periods for Jan and Feb 2026
        const janPeriod = await prisma.accountingPeriod.findFirst({
            where: { periodCode: '012026' }
        });

        const febPeriod = await prisma.accountingPeriod.findFirst({
            where: { periodCode: '022026' }
        });

        if (!janPeriod) {
            (() => {})('\n❌ January 2026 period not found');
            return;
        }

        (() => {})(`\n📅 JANUARY 2026:`);
        (() => {})(`   Period: ${janPeriod.periodName}`);
        (() => {})(`   Status: ${janPeriod.isClosed ? '🔒 CLOSED' : '🔓 OPEN'}`);
        if (janPeriod.closedAt) {
            (() => {})(`   Closed At: ${janPeriod.closedAt.toISOString()}`);
        }

        // Count GL Summary records for January
        const janGLCount = await prisma.generalLedgerSummary.count({
            where: { periodId: janPeriod.id }
        });

        (() => {})(`   GL Summary Records: ${janGLCount}`);

        if (febPeriod) {
            (() => {})(`\n📅 FEBRUARY 2026:`);
            (() => {})(`   Period: ${febPeriod.periodName}`);
            (() => {})(`   Status: ${febPeriod.isClosed ? '🔒 CLOSED' : '🔓 OPEN'}`);

            const febGLCount = await prisma.generalLedgerSummary.count({
                where: { periodId: febPeriod.id }
            });

            (() => {})(`   GL Summary Records: ${febGLCount}`);

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

                (() => {})(`\n   Sample Records:`);
                febSamples.forEach((gl, i) => {
                    (() => {})(`   ${i + 1}. ${gl.coa.accountCode} - ${gl.coa.accountName}`);
                    (() => {})(`      Beginning: Rp ${Number(gl.beginningBalance || 0).toLocaleString('id-ID')}`);
                    (() => {})(`      Ending:    Rp ${Number(gl.endingBalance || 0).toLocaleString('id-ID')}`);
                });
            }
        } else {
            (() => {})(`\n⚠️  February 2026 period not found`);
        }

        // Check Trial Balance
        (() => {})(`\n${'='.repeat(70)}`);
        (() => {})('TRIAL BALANCE RECORDS');
        (() => {})('='.repeat(70));

        const janTBCount = await prisma.trialBalance.count({
            where: { periodId: janPeriod.id }
        });

        (() => {})(`\n� JANUARY Trial Balance: ${janTBCount} records`);

        if (febPeriod) {
            const febTBCount = await prisma.trialBalance.count({
                where: { periodId: febPeriod.id }
            });

            (() => {})(`📊 FEBRUARY Trial Balance: ${febTBCount} records`);
        }

        (() => {})(`\n${'='.repeat(70)}`);
        (() => {})('✅ Verification Complete');
        (() => {})('='.repeat(70));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

checkGeneralLedgerSummary();
