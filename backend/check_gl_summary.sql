-- Check General Ledger Summary for January and February 2026

-- January 2026 Period
SELECT 
    'JANUARY 2026' as period,
    ap."periodName",
    ap."isClosed",
    (SELECT COUNT(*) FROM "GeneralLedgerSummary" WHERE "periodId" = ap.id) as gl_summary_count,
    (SELECT COUNT(*) FROM "TrialBalance" WHERE "periodId" = ap.id) as trial_balance_count
FROM "AccountingPeriod" ap
WHERE ap."periodCode" = '012026';

-- February 2026 Period
SELECT 
    'FEBRUARY 2026' as period,
    ap."periodName",
    ap."isClosed",
    (SELECT COUNT(*) FROM "GeneralLedgerSummary" WHERE "periodId" = ap.id) as gl_summary_count,
    (SELECT COUNT(*) FROM "TrialBalance" WHERE "periodId" = ap.id) as trial_balance_count
FROM "AccountingPeriod" ap
WHERE ap."periodCode" = '022026';

-- Sample GL Summary for February (if exists)
SELECT 
    c."accountCode",
    c."accountName",
    gls."beginningBalance",
    gls."debit",
    gls."credit",
    gls."endingBalance"
FROM "GeneralLedgerSummary" gls
JOIN "ChartOfAccounts" c ON c.id = gls."coaId"
JOIN "AccountingPeriod" ap ON ap.id = gls."periodId"
WHERE ap."periodCode" = '022026'
ORDER BY c."accountCode"
LIMIT 10;
