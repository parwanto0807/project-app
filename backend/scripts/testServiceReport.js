import { financialReportService } from '../src/services/accounting/financialReportService.js';

async function testReport() {
    try {
        const startDate = new Date('2026-02-01');
        const endDate = new Date('2026-02-28');

        (() => {})(`Running Income Statement for Feb 2026...`);
        const report = await financialReportService.getIncomeStatement({ startDate, endDate });

        const revenueAccount = report.revenue.accounts.find(a => a.code === '4-10101');
        if (revenueAccount) {
            (() => {})(`FOUND 4-10101 with amount: ${revenueAccount.amount}`);
        } else {
            (() => {})(`NOT FOUND 4-10101 in Jan Income Statement`);
        }

    } catch (e) {
        console.error(e);
    }
}

testReport();
