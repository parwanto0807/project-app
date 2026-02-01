SELECT 
    ap."periodName",
    ap."startDate",
    ap."endDate",
    ap."isClosed",
    COUNT(sb.id) as stock_records
FROM "AccountingPeriod" ap
LEFT JOIN "StockBalance" sb ON DATE_TRUNC('day', sb.period) = DATE_TRUNC('day', ap."startDate")
GROUP BY ap.id, ap."periodName", ap."startDate", ap."endDate", ap."isClosed"
ORDER BY ap."startDate";
