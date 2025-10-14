import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllUangMuka,
  getUangMukaById,
  createUangMuka,
  updateUangMuka,
  updateUangMukaStatus,
  deleteUangMuka,
  getUangMukaByKaryawan,
  getUangMukaStatistics,
  exportUangMuka,
} from "@/lib/action/um/actionUm";
import type {
  UpdateUangMukaInput,
  UpdateStatusInput,
  UangMukaQueryInput,
  UangMukaResponse,
} from "@/types/typesUm";

// ========================
// QUERY KEYS
// ========================

export const uangMukaKeys = {
  all: ["uang-muka"] as const,
  lists: () => [...uangMukaKeys.all, "list"] as const,
  list: (filters: UangMukaQueryInput) =>
    [...uangMukaKeys.lists(), filters] as const,
  details: () => [...uangMukaKeys.all, "detail"] as const,
  detail: (id: string) => [...uangMukaKeys.details(), id] as const,
  karyawan: (karyawanId: string, filters: UangMukaQueryInput) =>
    [...uangMukaKeys.all, "karyawan", karyawanId, filters] as const,
  statistics: () => [...uangMukaKeys.all, "statistics"] as const,
} as const;

// ========================
// QUERY HOOKS
// ========================

/**
 * Hook untuk get all uang muka dengan pagination dan filtering
 */
export function useUangMuka(filters?: UangMukaQueryInput) {
  return useQuery({
    queryKey: uangMukaKeys.list(filters || {}), // Handle undefined filters
    queryFn: () => getAllUangMuka(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook untuk get uang muka by ID
 */
export function useUangMukaById(id: string) {
  return useQuery({
    queryKey: uangMukaKeys.detail(id),
    queryFn: () => getUangMukaById(id),
    enabled: !!id, // Hanya fetch jika ID ada
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk get uang muka by karyawan ID
 */
export function useUangMukaByKaryawan(
  karyawanId: string,
  filters: Omit<UangMukaQueryInput, "karyawanId"> = {}
) {
  return useQuery({
    queryKey: uangMukaKeys.karyawan(karyawanId, filters),
    queryFn: () => getUangMukaByKaryawan(karyawanId, filters),
    enabled: !!karyawanId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk get uang muka statistics
 */
export function useUangMukaStatistics() {
  return useQuery({
    queryKey: uangMukaKeys.statistics(),
    queryFn: getUangMukaStatistics,
    staleTime: 2 * 60 * 1000, // 2 menit untuk statistics
  });
}

// ========================
// MUTATION HOOKS
// ========================

/**
 * Hook untuk create uang muka
 */
export function useCreateUangMuka() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUangMuka,
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate semua list queries
        queryClient.invalidateQueries({
          queryKey: uangMukaKeys.lists(),
        });
        // Invalidate statistics
        queryClient.invalidateQueries({
          queryKey: uangMukaKeys.statistics(),
        });
      }
    },
  });
}

/**
 * Hook untuk update uang muka
 */
export function useUpdateUangMuka() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUangMukaInput }) =>
      updateUangMuka(id, data),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidate detail query
        queryClient.invalidateQueries({
          queryKey: uangMukaKeys.detail(variables.id),
        });
        // Invalidate semua list queries
        queryClient.invalidateQueries({
          queryKey: uangMukaKeys.lists(),
        });
      }
    },
  });
}

/**
 * Hook untuk update status uang muka dengan file upload
 */
export function useUpdateUangMukaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatusInput }) =>
      updateUangMukaStatus(id, data),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidate detail query
        queryClient.invalidateQueries({
          queryKey: uangMukaKeys.detail(variables.id),
        });
        // Invalidate semua list queries
        queryClient.invalidateQueries({
          queryKey: uangMukaKeys.lists(),
        });
        // Invalidate statistics
        queryClient.invalidateQueries({
          queryKey: uangMukaKeys.statistics(),
        });
      }
    },
  });
}

/**
 * Hook untuk delete uang muka
 */
export function useDeleteUangMuka() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUangMuka,
    onSuccess: (data, id) => {
      if (data.success) {
        // Remove dari cache
        queryClient.removeQueries({
          queryKey: uangMukaKeys.detail(id),
        });
        // Invalidate semua list queries
        queryClient.invalidateQueries({
          queryKey: uangMukaKeys.lists(),
        });
        // Invalidate statistics
        queryClient.invalidateQueries({
          queryKey: uangMukaKeys.statistics(),
        });
      }
    },
  });
}

/**
 * Hook untuk export uang muka
 */
export function useExportUangMuka() {
  return useMutation({
    mutationFn: ({
      filters,
      format,
    }: {
      filters?: UangMukaQueryInput;
      format: "excel" | "pdf";
    }) => exportUangMuka(filters, format),
  });
}

// ========================
// OPTIMISTIC UPDATE HOOKS
// ========================

interface OptimisticUpdateContext {
  previousDetail?: UangMukaResponse;
}

/**
 * Hook untuk optimistic update status
 */
export function useOptimisticUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatusInput }) =>
      updateUangMukaStatus(id, data),
    onMutate: async (variables): Promise<OptimisticUpdateContext> => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: uangMukaKeys.detail(variables.id),
      });
      await queryClient.cancelQueries({
        queryKey: uangMukaKeys.lists(),
      });

      // Snapshot previous value
      const previousDetail = queryClient.getQueryData(
        uangMukaKeys.detail(variables.id)
      ) as UangMukaResponse | undefined;

      // Optimistically update cache
      queryClient.setQueryData(
        uangMukaKeys.detail(variables.id),
        (old: UangMukaResponse | undefined) =>
          old ? { ...old, data: { ...old.data, ...variables.data } } : old
      );

      return { previousDetail };
    },
    onError: (err, variables, context: OptimisticUpdateContext | undefined) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(
          uangMukaKeys.detail(variables.id),
          context.previousDetail
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidate queries setelah mutation selesai
      queryClient.invalidateQueries({
        queryKey: uangMukaKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: uangMukaKeys.lists(),
      });
    },
  });
}
