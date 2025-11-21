"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllSalesOrder, fetchAllSalesOrderSPK } from "@/lib/action/sales/salesOrder";
import { OrderStatusEnum } from "@/schemas/index";
import z from "zod";

type OrderStatus = z.infer<typeof OrderStatusEnum>;

// hooks/use-salesOrder.ts
export const useSalesOrder = (
  page: number,
  pageSize: number,
  searchTerm: string,
  statusFilter: OrderStatus | "ALL", // Pastikan parameter ini ada
  refreshTrigger: number
) => {
  return useQuery({
    queryKey: ["salesOrders", page, pageSize, searchTerm, statusFilter, refreshTrigger],
    queryFn: () => fetchAllSalesOrder(page, pageSize, searchTerm, statusFilter),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useSalesOrderData = () => {
  return useQuery({
    queryKey: ["salesOrdersAll"],
    queryFn: () => fetchAllSalesOrderSPK(),
    staleTime: 10 * 60 * 1000, // 10 menit
    gcTime: 20 * 60 * 1000,    // 20 menit
  });
};