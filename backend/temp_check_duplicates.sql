SELECT "fiscalYear", "periodMonth", COUNT(*) as count 
FROM "AccountingPeriod" 
GROUP BY "fiscalYear", "periodMonth" 
HAVING COUNT(*) > 1;
