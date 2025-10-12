import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CoaCashflowType,
  CoaFormData,
  CoaPostingType,
  CoaStatus,
} from "@/types/coa";
import {
  createCoaSchema,
  updateCoaSchema,
  CoaFilterInput,
  coaTypeOptions,
  normalBalanceOptions,
  postingTypeOptions,
  cashflowTypeOptions,
  statusOptions,
  coaFilterSchema,
} from "@/schemas/coa";
import { coaApi, coaUtils } from "@/lib/action/coa/coa";
import z from "zod";

// React Query hooks
export const useCOAs = (filters?: Partial<CoaFilterInput>) => {
  const parsedFilters = coaFilterSchema.parse(filters || {});

  return useQuery({
    queryKey: ["coas", parsedFilters],
    queryFn: () => coaApi.getCOAs(parsedFilters),
    staleTime: 5 * 60 * 1000, // 5 menit
  });
};

export const useCOA = (id: string | undefined) => {
  return useQuery({
    queryKey: ["coa", id],
    queryFn: () => coaApi.getCOAById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCOAHierarchy = (type?: string) => {
  return useQuery({
    queryKey: ["coa-hierarchy", type],
    queryFn: () => coaApi.getCOAHierarchy(type),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation hooks
export const useCreateCOA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coaApi.createCOA,
    onSuccess: () => {
      toast.success("COA berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["coas"] });
      queryClient.invalidateQueries({ queryKey: ["coa-hierarchy"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal membuat COA";
      toast.error(errorMessage);
    },
  });
};

export const useUpdateCOA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CoaFormData> }) =>
      coaApi.updateCOA(id, data),
    onSuccess: (data, variables) => {
      toast.success("COA berhasil diperbarui");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["coas"] });
      queryClient.invalidateQueries({ queryKey: ["coa", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["coa-hierarchy"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal memperbarui COA";
      toast.error(errorMessage);
    },
  });
};

export const useDeleteCOA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => coaApi.deleteCOA(id),
    onSuccess: () => {
      toast.success("COA berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["coas"] });
      queryClient.invalidateQueries({ queryKey: ["coa-hierarchy"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus COA";
      toast.error(errorMessage);
    },
  });
};

export const useDeactivateCOA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coaApi.deactivateCOA,
    onSuccess: (data, id) => {
      toast.success("COA berhasil dinonaktifkan");
      queryClient.invalidateQueries({ queryKey: ["coas"] });
      queryClient.invalidateQueries({ queryKey: ["coa", id] });
      queryClient.invalidateQueries({ queryKey: ["coa-hierarchy"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menonaktifkan COA";
      toast.error(errorMessage);
    },
  });
};

export const useActivateCOA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coaApi.activateCOA,
    onSuccess: (data, id) => {
      toast.success("COA berhasil diaktifkan");
      queryClient.invalidateQueries({ queryKey: ["coas"] });
      queryClient.invalidateQueries({ queryKey: ["coa", id] });
      queryClient.invalidateQueries({ queryKey: ["coa-hierarchy"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal mengaktifkan COA";
      toast.error(errorMessage);
    },
  });
};

// Form hooks
export const useCreateCOAForm = () => {
  return useForm<CoaFormData>({
    resolver: zodResolver(createCoaSchema),
    defaultValues: {
      postingType: CoaPostingType.POSTING,
      cashflowType: CoaCashflowType.NONE, // pastikan juga pakai enum
      status: CoaStatus.ACTIVE,
      isReconcilable: false,
      defaultCurrency: "IDR",
      description: "",
    },
  });
};

export type UpdateCoaFormData = z.infer<typeof updateCoaSchema>;

export const useUpdateCOAForm = (defaultValues?: UpdateCoaFormData) => {
  return useForm<UpdateCoaFormData>({
    resolver: zodResolver(updateCoaSchema),
    defaultValues,
  });
};

// Utility hooks
export const useCOAOptions = (filters?: CoaFilterInput) => {
  const { data, isLoading, error } = useCOAs({
    ...filters,
    status: CoaStatus.ACTIVE, // Default hanya yang aktif
  });

  const options =
    data?.data.map((coa) => ({
      value: coa.id,
      label: `${coa.code} - ${coa.name}`,
      data: coa,
    })) || [];

  return {
    options,
    isLoading,
    error,
  };
};

export const useHeaderCOAOptions = () => {
  return useCOAOptions({
    page: 1,
    limit: 100,
    postingType: CoaPostingType.HEADER,
    status: CoaStatus.ACTIVE,
  });
};

export const usePostingCOAOptions = () => {
  return useCOAOptions({
    page: 1,
    limit: 100,
    postingType: CoaPostingType.POSTING,
    status: CoaStatus.ACTIVE,
  });
};

// Search hook
export const useCOASearch = (searchTerm: string, enabled: boolean = true) => {
  const { data, isLoading, error } = useCOAs({
    search: searchTerm,
    limit: 20,
    status: CoaStatus.ACTIVE,
  });

  return {
    results: data?.data || [],
    isLoading: enabled ? isLoading : false,
    error,
  };
};

// COA Deletion hooks
export const useCOADeletionCheck = (coaId: string | undefined) => {
  const { data: coa, isLoading, error } = useCOA(coaId);

  const canDelete = coa?.data ? coaUtils.canDeleteCOA(coa.data) : false;
  const deletionConstraints = coa?.data
    ? coaUtils.getDeletionConstraints(coa.data)
    : [];

  return {
    canDelete,
    deletionConstraints,
    isLoading,
    error,
    coa: coa?.data,
  };
};

// COA Type utilities hook
export const useCOATypeUtils = () => {
  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      ASET: "bg-blue-100 text-blue-800 border-blue-200",
      LIABILITAS: "bg-red-100 text-red-800 border-red-200",
      EKUITAS: "bg-green-100 text-green-800 border-green-200",
      PENDAPATAN: "bg-purple-100 text-purple-800 border-purple-200",
      HPP: "bg-orange-100 text-orange-800 border-orange-200",
      BEBAN: "bg-pink-100 text-pink-800 border-pink-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800 border-green-200",
      INACTIVE: "bg-gray-100 text-gray-800 border-gray-200",
      LOCKED: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getNormalBalanceColor = (balance: string): string => {
    return balance === "DEBIT"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-green-100 text-green-800 border-green-200";
  };

  return {
    getTypeColor,
    getStatusColor,
    getNormalBalanceColor,
    typeOptions: coaTypeOptions,
    normalBalanceOptions,
    postingTypeOptions,
    cashflowTypeOptions,
    statusOptions,
  };
};

// COA Statistics hook
export const useCOAStatistics = () => {
  const {
    data: coas,
    isLoading,
    error,
  } = useCOAs({
    status: CoaStatus.ACTIVE,
    limit: 1000, // Get all active COAs for stats
  });

  const statistics = coas?.data
    ? {
        total: coas.data.length,
        byType: coas.data.reduce((acc, coa) => {
          acc[coa.type] = (acc[coa.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byPostingType: coas.data.reduce((acc, coa) => {
          acc[coa.postingType] = (acc[coa.postingType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        headerCount: coas.data.filter((coa) => coa.postingType === "HEADER")
          .length,
        postingCount: coas.data.filter((coa) => coa.postingType === "POSTING")
          .length,
        reconcilableCount: coas.data.filter((coa) => coa.isReconcilable).length,
      }
    : null;

  return {
    statistics,
    isLoading,
    error,
  };
};

// COA Bulk Operations hook
export const useCOABulkOperations = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: deactivateCOA } = useDeactivateCOA();
  const { mutateAsync: activateCOA } = useActivateCOA();

  const bulkDeactivate = async (ids: string[]) => {
    try {
      const results = await Promise.allSettled(
        ids.map((id) => deactivateCOA(id))
      );

      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;

      if (successful > 0) {
        toast.success(`${successful} COA berhasil dinonaktifkan`);
      }
      if (failed > 0) {
        toast.error(`${failed} COA gagal dinonaktifkan`);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["coas"] });
      queryClient.invalidateQueries({ queryKey: ["coa-hierarchy"] });

      return { successful, failed };
    } catch (error) {
      toast.error("Gagal menonaktifkan COA secara massal");
      throw error;
    }
  };

  const bulkActivate = async (ids: string[]) => {
    try {
      const results = await Promise.allSettled(
        ids.map((id) => activateCOA(id))
      );

      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;

      if (successful > 0) {
        toast.success(`${successful} COA berhasil diaktifkan`);
      }
      if (failed > 0) {
        toast.error(`${failed} COA gagal diaktifkan`);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["coas"] });
      queryClient.invalidateQueries({ queryKey: ["coa-hierarchy"] });

      return { successful, failed };
    } catch (error) {
      toast.error("Gagal mengaktifkan COA secara massal");
      throw error;
    }
  };

  return {
    bulkDeactivate,
    bulkActivate,
  };
};
