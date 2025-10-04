"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllProducts } from "@/lib/action/master/product";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchAllProducts,
    staleTime: 100 * 60 * 5,
    retry: 1,
  });
}
