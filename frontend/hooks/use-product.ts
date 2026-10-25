"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { fetchAllProducts } from "@/lib/action/master/product";

export function useProducts(options?: {
  compact?: boolean;
  isActive?: boolean;
}): UseQueryResult<Awaited<ReturnType<typeof fetchAllProducts>>, Error> {
  return useQuery({
    queryKey: ["products", options?.compact ? "compact" : "full", options?.isActive],
    queryFn: () => fetchAllProducts(options),
    staleTime: 100 * 60 * 5,
    retry: 1,
  });
}
