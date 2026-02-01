import { financialReportService } from '../src/services/accounting/financialReportService.js';
import fs from 'fs';

async function verifyReports() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        log('='.repeat(60));
        log('VERIFYING FINANCIAL REPORTS FOR FEBRUARY 2026');
        log('='.repeat(60));

        const febStart = new Date('2026-02-01');
        const febEnd = new Date('2026-02-01');
        const febRangeEnd = new Date('2026-02-28');

        log('\n📊 BALANCE SHEET (As of 2026-02-01):');
        const bs = await financialReportService.getBalanceSheet({ endDate: febEnd });
        log(`   Assets Total      : ${bs.assets.total}`);
        log(`   Liab + Equity Total: ${bs.totalLiabilitiesAndEquity}`);
        log(`   Is Balanced       : ${bs.checks.isBalanced}`);
        log(`   Difference        : ${bs.checks.difference}`);
        
        const kasPetiCash = bs.assets.currentAssets.accounts.find(a => a.code === '1-10001');
        log(`   Kas Peti Cash (1-10001) Balance: ${kasPetiCash ? kasPetiCash.amount : 'Not found'}`);

        log('\n💧 CASH FLOW (Feb 2026):');
        const cf = await financialReportService.getCashFlowReport({ 
            startDate: febStart, 
            endDate: febRangeEnd 
        });
        log(`   Beginning Balance : ${cf.beginningBalance}`);
        log(`   Net Change (Feb)  : ${cf.netChange}`);
        log(`   Ending Balance    : ${cf.endingBalance}`);
        
        log('\n✅ Verification Complete');
        log('='.repeat(60));

        fs.writeFileSync('scripts/report_verification.log', output);

    } catch (error) {
        log('❌ Error: ' + error.message);
        fs.writeFileSync('scripts/report_verification.log', output);
    }
}

verifyReports();
