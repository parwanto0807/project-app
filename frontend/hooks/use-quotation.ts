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

// GET - All quotations dengan pagination
export function useQuotations(params?: QuotationQueryParams) {
  return useQuery<QuotationListResponse, Error>({
    queryKey: ["quotations", params],
    queryFn: async () => {
      try {
        const response = await getQuotations(params);
        return response;
      } catch (error) {
        console.error("❌ Error fetching quotations:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
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

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuotationRequest }) =>
      updateQuotation(id, data),
    onSuccess: (_, variables) => {
      // Invalidate both list and specific quotation
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", variables.id] });
    },
  });
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
