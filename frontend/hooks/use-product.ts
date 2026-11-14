"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { fetchAllProducts } from "@/lib/action/master/product";
import { api } from "@/lib/http";

export function useProducts(options?: {
  compact?: boolean;
  isActive?: boolean;
}): UseQueryResult<Awaited<ReturnType<typeof fetchAllProducts>>, Error> {
  return useQuery({
    queryKey: ["products", options?.compact ? "compact" : "full", options?.isActive],
    queryFn: async () => {
      if (typeof window !== "undefined") {
        const params: Record<string, string> = { includePagination: "false" };
        if (options?.compact) params.compact = "true";
        if (options?.isActive !== undefined) {
          params.activeOnly = String(options.isActive);
        }

        const res = await api.get("/api/master/product/getAllProducts", { params });
        const raw = res.data;
        let products = Array.isArray(raw) ? raw : raw?.products || [];
        if (options?.isActive !== undefined) {
          products = products.filter((p: { isActive?: boolean }) => p.isActive === options.isActive);
        }
        return {
          products,
          isLoading: false,
          success: true,
          data: { data: products },
        };
      }
      return fetchAllProducts(options);
    },
    staleTime: 100 * 60 * 5,
    retry: 1,
  });
}
