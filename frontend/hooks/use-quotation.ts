"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  uploadAttachment,
  addComment,
} from "@/lib/action/sales/quotation";
import {
  CreateQuotationRequest,
  UpdateQuotationRequest,
  UpdateQuotationStatusRequest,
  AddCommentRequest,
  QuotationQueryParams,
  QuotationListResponse,
} from "@/types/quotation";
import { useState } from "react";

// Hook useQuotations
export function useQuotations(params?: QuotationQueryParams) {
  return useQuery<QuotationListResponse, Error>({
    queryKey: ["quotations", params],
    queryFn: async () => {
      const response = await getQuotations(params);
      return response; // sudah sesuai ListResponse<QuotationSummary>
    },
    staleTime: 1000 * 60 * 5, // cache 5 menit
  });
}

// GET - Single quotation by ID
export function useQuotation(id: string) {
  return useQuery({
    queryKey: ["quotation", id],
    queryFn: () => getQuotationById(id),
    enabled: !!id, // Hanya fetch jika ID ada
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// POST - Create quotation
export function useCreateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuotationRequest) => {
      try {
        const result = await createQuotation(data);

        // Jika createQuotation return object dengan success property
        if (result && typeof result === "object" && "success" in result) {
          if (!result.success) {
            throw new Error(
              result.quotationNumber || "Failed to create quotation"
            );
          }
          return result;
        }

        // Jika return langsung data tanpa wrapper object
        return result;
      } catch (error) {
        console.error("Error in mutationFn:", error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Failed to create quotation");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (error: Error) => {
      console.error("Mutation onError:", error.message);
    },
  });
}

// PUT - Update quotation
export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: UpdateQuotationRequest & { id: string }) => {
      try {
        const result = await updateQuotation(id, data);
        return result;
      } catch (err) {
        console.error("❌ Update failed:", err);
        setError(err as Error);
        throw err;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", variables.id] });
      queryClient.setQueryData(["quotation", variables.id], data);

      setError(null);
    },
    onError: (error: Error) => {
      console.error("💥 Update onError:", error);
      setError(error);
    },
  });

  return {
    ...mutation,
    error,
    clearError: () => setError(null),
  };
}

// DELETE - Delete quotation
export function useDeleteQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

// PATCH - Update status
export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateQuotationStatusRequest;
    }) => updateQuotationStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", variables.id] });
    },
  });
}

// POST - Upload attachment
export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      uploadAttachment(id, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotation", variables.id] });
    },
  });
}

// POST - Add comment
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddCommentRequest }) =>
      addComment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotation", variables.id] });
    },
  });
}

// Bulk operations
