import { financialReportService } from '../src/services/accounting/financialReportService.js';
import fs from 'fs';

async function verifyIncomeStatement() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        log('='.repeat(60));
        log('VERIFYING INCOME STATEMENT FOR FEBRUARY 2026');
        log('='.repeat(60));

        const febStart = new Date('2026-02-01');
        const febEnd = new Date('2026-02-28');

        log('\n📈 INCOME STATEMENT (Feb 2026):');
        const is = await financialReportService.getIncomeStatement({ 
            startDate: febStart, 
            endDate: febEnd 
        });
        
        log(`   Total Revenue : ${is.revenue.total}`);
        log(`   Total COGS    : ${is.cogs.total}`);
        log(`   Total Expenses: ${is.expenses.total}`);
        log(`   Net Profit    : ${is.netProfit}`);
        
        if (is.revenue.accounts.length > 0 || is.expenses.accounts.length > 0) {
            log('\n⚠️ WARNING: Found unexpected accounts in Feb Income Statement:');
            is.revenue.accounts.forEach(a => log(`   - [REV] ${a.code}: ${a.amount}`));
            is.expenses.accounts.forEach(a => log(`   - [EXP] ${a.code}: ${a.amount}`));
        } else {
            log('\n✅ February Income Statement is empty (as expected)');
        }

        log('\n✅ Verification Complete');
        log('='.repeat(60));

        fs.appendFileSync('scripts/report_verification.log', '\n' + output);

    } catch (error) {
        log('❌ Error: ' + error.message);
    }
}

verifyIncomeStatement();
