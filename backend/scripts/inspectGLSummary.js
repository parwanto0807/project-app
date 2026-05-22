import { PrismaClient } from '../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

async function inspectFinal() {
    try {
        const periods = await prisma.accountingPeriod.findMany({
            orderBy: { startDate: 'asc' }
        });

        ;(() => {})('--- PERIODS ---');
        for (const p of periods) {
            ;(() => {})(`[${p.periodCode}] ${p.periodName}`);
            ;(() => {})(`  Start : ${p.startDate.toISOString()}`);
            ;(() => {})(`  End   : ${p.endDate.toISOString()}`);
            ;(() => {})(`  ID    : ${p.id}`);
            ;(() => {})(`  Closed: ${p.isClosed}`);
        }

        const feb = periods.find(p => p.periodCode === '022026');
        if (feb) {
            ;(() => {})('\n--- GL SUMMARIES FOR FEB PERIOD ---');
            const summaries = await prisma.generalLedgerSummary.findMany({
                where: { periodId: feb.id },
                include: { coa: { select: { code: true } } },
                orderBy: { date: 'asc' },
                take: 10
            });
            for (const s of summaries) {
                ;(() => {})(`  Date: ${s.date.toISOString()} | COA: ${s.coa.code} | Debit: ${s.debitTotal} | Credit: ${s.creditTotal}`);
            }
        }

        ;(() => {})('\n--- GL SUMMARIES FOR JAN 31 (UTC START) ---');
        // Check if any summaries for Jan 31 (WIB) are in Feb period
        // Jan 31 00:00 WIB = Jan 30 17:00 UTC
        const targetDate = new Date('2026-01-30T17:00:00.000Z');
        const sums = await prisma.generalLedgerSummary.findMany({
            where: { date: targetDate },
            include: { period: { select: { periodCode: true } }, coa: { select: { code: true } } },
            take: 10
        });
        for (const s of sums) {
            ;(() => {})(`  COA: ${s.coa.code} | Period: ${s.period.periodCode} | Date: ${s.date.toISOString()}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

inspectFinal();
