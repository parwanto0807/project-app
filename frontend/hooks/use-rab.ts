import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRABs,
  getRAB,
  getRABsByProject,
  createRAB,
  updateRAB,
  updateRABStatus,
  deleteRAB,
} from "@/lib/action/rab/rab";
import {
  calculateRABTotals,
  formatCurrency,
  getStatusColor,
  getStatusText,
  getCostTypeText,
  validateRABData,
} from "@/lib/action/rab/rab-utils";
import { RABCreateInput, RABStatusUpdate, RABUpdateInput } from "@/types/rab";

export const rabActions = {
  // Server Actions
  getRABs,
  getRAB,
  getRABsByProject,
  createRAB,
  updateRAB,
  updateRABStatus,
  deleteRAB,

  // Utility Functions
  calculateRABTotals,
  formatCurrency,
  getStatusColor,
  getStatusText,
  getCostTypeText,
  validateRABData,
};

// Define comprehensive filter types
export interface RABListFilters {
  projectId?: string;
  status?: "DRAFT" | "APPROVED" | "REJECTED";
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "createdAt" | "total" | "status";
  sortOrder?: "asc" | "desc";
}

// Create a type-safe query key factory
const createRABKeys = {
  all: () => ["rabs"] as const,
  lists: () => [...createRABKeys.all(), "list"] as const,
  list: (filters: RABListFilters) =>
    [...createRABKeys.lists(), filters] as const,
  details: () => [...createRABKeys.all(), "detail"] as const,
  detail: (id: string) => [...createRABKeys.details(), id] as const,
  project: (projectId: string) =>
    [...createRABKeys.all(), "project", projectId] as const,
  summary: (projectId?: string) =>
    [...createRABKeys.all(), "summary", projectId] as const,
} as const;

// Export for use in hooks
export const RAB_KEYS = createRABKeys;

// Hook types
export interface UseRABsOptions {
  filters?: RABListFilters;
  enabled?: boolean;
}

export const useRABs = ({ filters, enabled = true }: UseRABsOptions = {}) => {
  return useQuery({
    queryKey: RAB_KEYS.list(filters || {}),
    queryFn: () => rabActions.getRABs(filters),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRAB = (id: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: RAB_KEYS.detail(id),
    queryFn: () => rabActions.getRAB(id),
    enabled: options.enabled !== false && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRABsByProject = (
  projectId: string,
  options: { enabled?: boolean } = {}
) => {
  return useQuery({
    queryKey: RAB_KEYS.project(projectId),
    queryFn: () => rabActions.getRABsByProject(projectId),
    enabled: options.enabled !== false && !!projectId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateRAB = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RABCreateInput) => rabActions.createRAB(data),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: RAB_KEYS.lists() });
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: RAB_KEYS.project(variables.projectId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: RAB_KEYS.summary(variables.projectId),
      });
    },
  });
};

export const useUpdateRAB = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RABUpdateInput) => rabActions.updateRAB(data),
    onSuccess: (data, variables) => {
      // Invalidate specific RAB and lists
      queryClient.invalidateQueries({
        queryKey: RAB_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: RAB_KEYS.lists() });
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: RAB_KEYS.project(variables.projectId),
        });
      }
    },
  });
};

export const useUpdateRABStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RABStatusUpdate }) =>
      rabActions.updateRABStatus(id, status),
    onSuccess: (data, variables) => {
      // Invalidate specific RAB and lists
      queryClient.invalidateQueries({
        queryKey: RAB_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: RAB_KEYS.lists() });

      // If we have the RAB data, invalidate project queries too
      if (data.data?.projectId) {
        queryClient.invalidateQueries({
          queryKey: RAB_KEYS.project(data.data.projectId),
        });
      }
    },
  });
};

export const useDeleteRAB = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rabActions.deleteRAB(id),
    onSuccess: (data, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: RAB_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: RAB_KEYS.lists() });

      // Note: We can't invalidate project queries here without projectId
      // You might want to return projectId from the delete action
    },
  });
};

export const useRABSummary = (projectId?: string) => {
  return useQuery({
    queryKey: RAB_KEYS.summary(projectId),
    queryFn: async () => {
      const filters = projectId ? { projectId } : {};
      const response = await rabActions.getRABs(filters);

      if (!response.success) {
        throw new Error("Failed to fetch RAB summary");
      }

      const rabs = response.data;

      const totalRABs = rabs.length;
      const totalValue = rabs.reduce((sum, rab) => sum + rab.total, 0);
      const statusCounts = {
        DRAFT: rabs.filter((rab) => rab.status === "DRAFT").length,
        APPROVED: rabs.filter((rab) => rab.status === "APPROVED").length,
        REJECTED: rabs.filter((rab) => rab.status === "REJECTED").length,
      };

      // Calculate cost type breakdown
      const costTypeBreakdown = rabs.reduce((acc, rab) => {
        rab.rabDetails.forEach((detail) => {
          const costType = detail.costType;
          if (!acc[costType]) {
            acc[costType] = 0;
          }
          acc[costType] += detail.qty * detail.price;
        });
        return acc;
      }, {} as Record<string, number>);

      return {
        totalRABs,
        totalValue,
        statusCounts,
        costTypeBreakdown,
      };
    },
    enabled: true,
  });
};

// Additional utility hooks
export const useRABStats = (projectId?: string) => {
  const { data: summary } = useRABSummary(projectId);

  return {
    totalRABs: summary?.totalRABs || 0,
    totalValue: summary?.totalValue || 0,
    approvedCount: summary?.statusCounts.APPROVED || 0,
    draftCount: summary?.statusCounts.DRAFT || 0,
    rejectedCount: summary?.statusCounts.REJECTED || 0,
    costTypeBreakdown: summary?.costTypeBreakdown || {},
  };
};
