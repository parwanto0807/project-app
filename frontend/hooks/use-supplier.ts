"use client";

import { useState, useEffect, useCallback } from "react";
import { SupplierListResponse } from "@/types/supplierType";
import { fetchSuppliers } from "@/lib/action/supplier/supplierAction";
import { toast } from "sonner";

export function useSupplier(
  page: number,
  limit: number,
  search: string,
  activeOnly: boolean | string = "false",
  refreshTrigger?: number
) {
  const [data, setData] = useState<SupplierListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsFetching(true);

    try {
      const res = await fetchSuppliers({
        page,
        limit,
        search,
        activeOnly,
        includePagination: "true",
      });

      if (!res.success) {
        const msg = res.message ?? "Failed to fetch suppliers";
        setError(msg);
        toast.error(msg);
        return;
      }

      setData(res);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error fetching supplier data";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [page, limit, search, activeOnly]); // refreshTrigger bukan internal-param

  // refreshTrigger hanya trigger re-fetch
  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch: loadData,
  };
}
