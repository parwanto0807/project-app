"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as taxActions from "@/lib/action/master/tax/tax";

// Define types for better type safety
export interface Tax {
  id: string;
  name: string;
  rate: number;
  // tambahkan properti lain sesuai kebutuhan
}

export interface CreateTaxData {
  name: string;
  rate: number;
  // tambahkan properti lain sesuai kebutuhan
}

export interface UpdateTaxData {
  name?: string;
  rate?: number;
  // tambahkan properti lain sesuai kebutuhan
}

export function useTaxes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["taxes"],
    queryFn: taxActions.fetchTaxes,
    staleTime: 1000 * 60 * 5, // 5 menit
  });

  const createTax = useMutation({
    mutationFn: taxActions.createTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
    },
    onError: (error) => {
      console.error("Error creating tax:", error);
      // Tambahkan handling error lainnya (toast notification, dll)
    }
  });

  const updateTax = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaxData }) => 
      taxActions.updateTax(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
    },
    onError: (error) => {
      console.error("Error updating tax:", error);
      // Tambahkan handling error lainnya
    }
  });

  const deleteTax = useMutation({
    mutationFn: (id: string) => taxActions.deleteTax(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
    },
    onError: (error) => {
      console.error("Error deleting tax:", error);
      // Tambahkan handling error lainnya
    }
  });

  return { 
    ...query, 
    createTax, 
    updateTax, 
    deleteTax 
  };
}