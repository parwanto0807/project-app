"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllCustomers } from "@/lib/action/master/customer";

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"], // key unik untuk cache
    queryFn: fetchAllCustomers,
    staleTime: 1000 * 60 * 5, // cache 5 menit
    retry: 1, // jika gagal, coba 1x
  });
}
