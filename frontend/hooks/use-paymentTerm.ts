"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as paymentActions from "@/lib/action/master/paymentTerm/paymetTerm";

// Define types for better type safety
export interface PaymentTerm {
  id: string;
  name: string;
  days: number;
  // tambahkan properti lain sesuai kebutuhan
}

export interface CreatePaymentTermData {
  name: string;
  days: number;
  // tambahkan properti lain sesuai kebutuhan
}

export interface UpdatePaymentTermData {
  name?: string;
  days?: number;
  // tambahkan properti lain sesuai kebutuhan
}

export function usePaymentTerms() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["paymentTerms"],
    queryFn: paymentActions.fetchPaymentTerms,
    staleTime: 1000 * 60 * 5, // 5 menit
  });

  const createPaymentTerm = useMutation({
    mutationFn: paymentActions.createPaymentTerm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentTerms"] });
    },
    onError: (error) => {
      console.error("Error creating payment term:", error);
      // Tambahkan handling error lainnya (toast notification, dll)
    },
  });

  const updatePaymentTerm = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentTermData }) =>
      paymentActions.updatePaymentTerm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentTerms"] });
    },
    onError: (error) => {
      console.error("Error updating payment term:", error);
      // Tambahkan handling error lainnya
    },
  });

  const deletePaymentTerm = useMutation({
    mutationFn: (id: string) => paymentActions.deletePaymentTerm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentTerms"] });
    },
    onError: (error) => {
      console.error("Error deleting payment term:", error);
      // Tambahkan handling error lainnya
    },
  });

  return {
    ...query,
    createPaymentTerm,
    updatePaymentTerm,
    deletePaymentTerm,
  };
}
