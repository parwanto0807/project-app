import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PurchaseRequest,
  CreatePurchaseRequestData,
  UpdatePurchaseRequestData,
  UpdatePurchaseRequestStatusData,
  PurchaseRequestFilters,
} from "@/types/pr";
import {
  getAllPurchaseRequests,
  getPurchaseRequestsByProject,
  getPurchaseRequestById,
  getAllPurchaseRequestBySpkId,
  createPurchaseRequest as createPurchaseRequestAction,
  updatePurchaseRequest as updatePurchaseRequestAction,
  updatePurchaseRequestStatus as updatePurchaseRequestStatusAction,
  deletePurchaseRequest as deletePurchaseRequestAction,
} from "@/lib/action/pr/pr";

// Pastikan fungsi getAllPurchaseRequestBySpkId ada dan bekerja dengan benar
export function usePurchaseRequestsBySpkId(spkId?: string) {
  return useQuery<PurchaseRequest[], Error>({
    queryKey: ["purchaseRequests", "spk", spkId],
    queryFn: async () => {
      if (!spkId) throw new Error("spkId tidak boleh kosong");
      const data = await getAllPurchaseRequestBySpkId(spkId);
      console.log("PR data received:", data);
      return data;
    },
    enabled: !!spkId,
    staleTime: 1000 * 60 * 5, // 5 menit
    retry: 2, // Retry 2 kali jika gagal
  });
}
interface UsePurchaseRequestReturn {
  // State
  purchaseRequests: PurchaseRequest[];
  currentPurchaseRequest: PurchaseRequest | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchAllPurchaseRequests: (filters?: PurchaseRequestFilters) => Promise<void>;
  fetchPurchaseRequestsByProject: (projectId: string) => Promise<void>;
  fetchPurchaseRequestById: (id: string) => Promise<void>;
  createPurchaseRequest: (
    data: CreatePurchaseRequestData
  ) => Promise<PurchaseRequest>;
  updatePurchaseRequest: (
    id: string,
    data: UpdatePurchaseRequestData
  ) => Promise<PurchaseRequest>;
  updatePurchaseRequestStatus: (
    id: string,
    data: UpdatePurchaseRequestStatusData
  ) => Promise<PurchaseRequest>;
  deletePurchaseRequest: (id: string) => Promise<void>;

  // Utilities
  clearError: () => void;
  clearCurrentPurchaseRequest: () => void;
  refetch: () => Promise<void>;
}

// Hook untuk operasi CRUD lengkap
export function usePurchaseRequest(): UsePurchaseRequestReturn {
  const queryClient = useQueryClient();

  // Query untuk semua purchase requests dengan filter
  const {
    data: purchaseRequests = [],
    error: queryError,
    isLoading: loading,
    refetch: refetchAll,
  } = useQuery<PurchaseRequest[], Error>({
    queryKey: ["purchaseRequests", "all"],
    queryFn: () => getAllPurchaseRequests(),
    enabled: false, // Manual fetch
  });

  // Query untuk current purchase request
  const { data: currentPurchaseRequest = null, error: currentError } = useQuery<
    PurchaseRequest | null,
    Error
  >({
    queryKey: ["purchaseRequests", "current"],
    queryFn: () => null as PurchaseRequest | null,
    enabled: false, // Manual fetch
  });

  const error = queryError?.message || currentError?.message || null;

  // Mutations untuk CRUD operations
  const createMutation = useMutation<
    PurchaseRequest,
    Error,
    CreatePurchaseRequestData
  >({
    mutationFn: createPurchaseRequestAction,
    onSuccess: (newPR) => {
      queryClient.setQueryData<PurchaseRequest[]>(
        ["purchaseRequests", "all"],
        (old = []) => [newPR, ...old]
      );
    },
  });

  const updateMutation = useMutation<
    PurchaseRequest,
    Error,
    { id: string; data: UpdatePurchaseRequestData }
  >({
    mutationFn: ({ id, data }) => updatePurchaseRequestAction(id, data),
    onSuccess: (updatedPR) => {
      // Update all purchase requests list
      queryClient.setQueryData<PurchaseRequest[]>(
        ["purchaseRequests", "all"],
        (old = []) => old.map((pr) => (pr.id === updatedPR.id ? updatedPR : pr))
      );

      // Update current purchase request if it's the same one
      queryClient.setQueryData<PurchaseRequest | null>(
        ["purchaseRequests", "current"],
        (old) => (old?.id === updatedPR.id ? updatedPR : old)
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["purchaseRequests"] });
    },
  });

  const updateStatusMutation = useMutation<
    PurchaseRequest,
    Error,
    { id: string; data: UpdatePurchaseRequestStatusData }
  >({
    mutationFn: ({ id, data }) => updatePurchaseRequestStatusAction(id, data),
    onSuccess: (updatedPR) => {
      // Update all purchase requests list
      queryClient.setQueryData<PurchaseRequest[]>(
        ["purchaseRequests", "all"],
        (old = []) => old.map((pr) => (pr.id === updatedPR.id ? updatedPR : pr))
      );

      // Update current purchase request if it's the same one
      queryClient.setQueryData<PurchaseRequest | null>(
        ["purchaseRequests", "current"],
        (old) => (old?.id === updatedPR.id ? updatedPR : old)
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["purchaseRequests"] });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deletePurchaseRequestAction,
    onSuccess: (_, id) => {
      // Remove from all purchase requests list
      queryClient.setQueryData<PurchaseRequest[]>(
        ["purchaseRequests", "all"],
        (old = []) => old.filter((pr) => pr.id !== id)
      );

      // Clear current purchase request if it's the same one
      queryClient.setQueryData<PurchaseRequest | null>(
        ["purchaseRequests", "current"],
        (old) => (old?.id === id ? null : old)
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["purchaseRequests"] });
    },
  });

  const handleError = useCallback((err: unknown): string => {
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("Purchase Request Error:", err);
    return errorMessage;
  }, []);

  const fetchAllPurchaseRequests = useCallback(
    async (filters?: PurchaseRequestFilters): Promise<void> => {
      try {
        const data = await getAllPurchaseRequests(filters);
        queryClient.setQueryData(["purchaseRequests", "all"], data);
      } catch (err) {
        handleError(err);
      }
    },
    [queryClient, handleError]
  );

  const fetchPurchaseRequestsByProject = useCallback(
    async (projectId: string): Promise<void> => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      try {
        await queryClient.fetchQuery({
          queryKey: ["purchaseRequests", "project", projectId],
          queryFn: () => getPurchaseRequestsByProject(projectId),
        });
      } catch (err) {
        handleError(err);
      }
    },
    [queryClient, handleError]
  );

  const fetchPurchaseRequestById = useCallback(
    async (id: string): Promise<void> => {
      if (!id) {
        throw new Error("Purchase Request ID is required");
      }

      try {
        await queryClient.fetchQuery({
          queryKey: ["purchaseRequests", "detail", id],
          queryFn: () => getPurchaseRequestById(id),
        });
      } catch (err) {
        handleError(err);
        queryClient.setQueryData(["purchaseRequests", "current"], null);
      }
    },
    [queryClient, handleError]
  );

  const createPurchaseRequest = useCallback(
    async (data: CreatePurchaseRequestData): Promise<PurchaseRequest> => {
      try {
        const result = await createMutation.mutateAsync(data);
        return result;
      } catch (err) {
        const errorMessage = handleError(err);
        throw new Error(errorMessage);
      }
    },
    [createMutation, handleError]
  );

  const updatePurchaseRequest = useCallback(
    async (
      id: string,
      data: UpdatePurchaseRequestData
    ): Promise<PurchaseRequest> => {
      if (!id) {
        throw new Error("Purchase Request ID is required");
      }

      try {
        const result = await updateMutation.mutateAsync({ id, data });
        return result;
      } catch (err) {
        const errorMessage = handleError(err);
        throw new Error(errorMessage);
      }
    },
    [updateMutation, handleError]
  );

  const updatePurchaseRequestStatus = useCallback(
    async (
      id: string,
      data: UpdatePurchaseRequestStatusData
    ): Promise<PurchaseRequest> => {
      if (!id) {
        throw new Error("Purchase Request ID is required");
      }

      try {
        const result = await updateStatusMutation.mutateAsync({ id, data });
        return result;
      } catch (err) {
        const errorMessage = handleError(err);
        throw new Error(errorMessage);
      }
    },
    [updateStatusMutation, handleError]
  );

  const deletePurchaseRequest = useCallback(
    async (id: string): Promise<void> => {
      if (!id) {
        throw new Error("Purchase Request ID is required");
      }

      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        const errorMessage = handleError(err);
        throw new Error(errorMessage);
      }
    },
    [deleteMutation, handleError]
  );

  const refetch = useCallback(async (): Promise<void> => {
    await refetchAll();
  }, [refetchAll]);

  const clearError = useCallback(() => {
    // Clear errors dari queries
    queryClient.setQueriesData(
      { queryKey: ["purchaseRequests"] },
      (old: unknown) => {
        if (old && typeof old === "object" && "error" in old) {
          return { ...old, error: null };
        }
        return old;
      }
    );
  }, [queryClient]);

  const clearCurrentPurchaseRequest = useCallback(() => {
    queryClient.setQueryData(["purchaseRequests", "current"], null);
  }, [queryClient]);

  const isLoading =
    loading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    updateStatusMutation.isPending ||
    deleteMutation.isPending;

  return {
    purchaseRequests,
    currentPurchaseRequest,
    loading: isLoading,
    error,
    fetchAllPurchaseRequests,
    fetchPurchaseRequestsByProject,
    fetchPurchaseRequestById,
    createPurchaseRequest,
    updatePurchaseRequest,
    updatePurchaseRequestStatus,
    deletePurchaseRequest,
    clearError,
    clearCurrentPurchaseRequest,
    refetch,
  };
}

// Hook khusus untuk delete operation (standalone)
interface UseDeletePurchaseRequestReturn {
  deletePurchaseRequest: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useDeletePurchaseRequest(): UseDeletePurchaseRequestReturn {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deletePurchaseRequest,
    isPending: loading,
    error,
    reset,
  } = useMutation<void, Error, string>({
    mutationFn: deletePurchaseRequestAction,
    onSuccess: () => {
      // Invalidate purchase requests queries
      queryClient.invalidateQueries({ queryKey: ["purchaseRequests"] });
    },
  });

  const clearError = useCallback(() => {
    reset();
  }, [reset]);

  return {
    deletePurchaseRequest,
    loading,
    error: error?.message || null,
    clearError,
  };
}

// Hook tambahan untuk berbagai use case
export function usePurchaseRequests(filters?: PurchaseRequestFilters) {
  return useQuery<PurchaseRequest[], Error>({
    queryKey: ["purchaseRequests", "list", filters],
    queryFn: () => getAllPurchaseRequests(filters),
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

export function usePurchaseRequestDetail(id?: string) {
  return useQuery<PurchaseRequest, Error>({
    queryKey: ["purchaseRequests", "detail", id],
    queryFn: () => {
      if (!id) throw new Error("Purchase Request ID is required");
      return getPurchaseRequestById(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 menit
  });
}

export function usePurchaseRequestsByProject(projectId?: string) {
  return useQuery<PurchaseRequest[], Error>({
    queryKey: ["purchaseRequests", "project", projectId],
    queryFn: () => {
      if (!projectId) throw new Error("Project ID is required");
      return getPurchaseRequestsByProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}
