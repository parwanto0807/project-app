"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { fetchAllProducts } from "@/lib/action/master/product";

export function useProducts(): UseQueryResult<Awaited<ReturnType<typeof fetchAllProducts>>, Error> {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => fetchAllProducts(),
    staleTime: 100 * 60 * 5,
    retry: 1,
  });
}
