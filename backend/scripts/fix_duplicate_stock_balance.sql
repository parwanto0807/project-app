-- Cek duplikat: productId, warehouseId sama dalam periode yang sama
SELECT sb1.id AS id_to_delete, sb1.period, sb1."stockAkhir", sb1."availableStock", sb1."justIn",
       sb2.id AS id_to_keep, sb2.period, sb2."stockAkhir", sb2."availableStock", sb2."justIn"
FROM "StockBalance" sb1
JOIN "StockBalance" sb2 
  ON sb1."productId" = sb2."productId" 
 AND sb1."warehouseId" = sb2."warehouseId"
 AND date_trunc('month', sb1.period) = date_trunc('month', sb2.period)
 AND sb1.id <> sb2.id
WHERE sb1."stockAkhir" = 0 AND sb1."availableStock" = 0
  AND sb2."stockAkhir" > 0;

-- Hapus entry duplikat (stockAkhir = 0)
DELETE FROM "StockBalance"
WHERE id IN (
  SELECT sb1.id
  FROM "StockBalance" sb1
  JOIN "StockBalance" sb2 
    ON sb1."productId" = sb2."productId" 
   AND sb1."warehouseId" = sb2."warehouseId"
   AND date_trunc('month', sb1.period) = date_trunc('month', sb2.period)
   AND sb1.id <> sb2.id
  WHERE sb1."stockAkhir" = 0 AND sb1."availableStock" = 0
    AND sb2."stockAkhir" > 0
);
