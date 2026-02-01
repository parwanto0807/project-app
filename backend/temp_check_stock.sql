-- Cek jumlah record per periode
SELECT 
    TO_CHAR(period, 'YYYY-MM') as bulan,
    COUNT(*) as total_records
FROM "StockBalance"
GROUP BY TO_CHAR(period, 'YYYY-MM')
ORDER BY bulan;
