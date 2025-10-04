"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllSalesOrder } from "@/lib/action/sales/salesOrder";

export function useSalesOrder() {
  return useQuery({
    queryKey: ["salesOrders"], // key unik untuk cache
    queryFn: fetchAllSalesOrder,
    staleTime: 1000 * 60 * 5, // cache 5 menit
    retry: 1, // jika gagal, coba 1x
  });
}
