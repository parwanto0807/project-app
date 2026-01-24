import { PurchaseRequest, PurchaseRequestWithRelations } from "@/types/pr";
import { PaginationInfo } from "@/types/pr";

// Define the exact status types
export type PRStatus = "DRAFT" | "REVISION_NEEDED" | "SUBMITTED" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface PurchaseRequestTableProps {
  purchaseRequests: PurchaseRequestWithRelations[];
  isLoading: boolean;
  isError: boolean;
  role: "super" | "admin" | "pic";
  pagination: PaginationInfo;
  currentSearch?: string;
  currentStatus?: PRStatus;
  currentProjectId?: string;
  currentDateFrom?: Date;
  currentDateTo?: Date;
  currentTab?: "all" | "umum" | "project";
}

export interface UsePurchaseRequestTableProps {
  purchaseRequests: PurchaseRequestWithRelations[];
  role: string;
  currentSearch: string;
  currentDateFrom?: Date;
  currentDateTo?: Date;
  onSearchChange: (search: string) => void;
  onDateFilterChange: (dateFrom?: Date, dateTo?: Date) => void;
  onStatusUpdate: (id: string, status: PurchaseRequest['status']) => void;
}

export interface TableHeaderProps {
  searchInput: string;
  showFilters: boolean;
  localDateFrom: string;
  localDateTo: string;
  currentStatus?: PRStatus;
  currentProjectId?: string;
  projects: Array<{ id: string; name: string }>;
  onSearchSubmit: (e: React.FormEvent) => void;
  onSearchChange: (value: string) => void;
  onShowFiltersChange: (show: boolean) => void;
  onLocalDateFromChange: (date: string) => void;
  onLocalDateToChange: (date: string) => void;
  onStatusFilterChange: (status: PRStatus | undefined) => void;
  onProjectFilterChange: (projectId: string) => void;
  onDateFilterApply: () => void;
  onClearDateFilters: () => void;
  onClearFilters: () => void;
}

export interface DesktopTableViewProps {
  purchaseRequests: PurchaseRequestWithRelations[];
  isLoading: boolean;
  expandedRows: Set<string>;
  role: string;
  isDeleting: boolean;
  onToggleRowExpansion: (prId: string) => void;
  onViewDetail: (pr: PurchaseRequestWithRelations) => void;
  onViewPdf: (pr: PurchaseRequestWithRelations) => void;
  onCreateLpp: (id: string) => void;
  onEdit: (pr: PurchaseRequestWithRelations) => void;
  onDelete: (id: string) => void;
  getSerialNumber: (index: number) => number;
  showSkeleton?: boolean;
  skeletonRows?: number;
  enableTabFilter?: boolean;
  activeTab?: "all" | "umum" | "project";
  onTabChange?: (tab: "all" | "umum" | "project") => void;
  counts?: {
    all: number;
    umum: number;
    project: number;
  };
  onPrNumberSearch?: (tab: "umum" | "project", search: string) => void;
  onSettleBudget?: (prId: string) => void;
}

export interface MobileCardViewProps {
  purchaseRequests: PurchaseRequestWithRelations[];
  isLoading: boolean;
  expandedRows: Set<string>;
  role: string;
  isDeleting: boolean;
  hasActiveFilters: boolean;
  currentSearch?: string;
  currentStatus?: PRStatus;
  currentProjectId?: string;
  currentDateFrom?: Date;
  onToggleRowExpansion: (prId: string) => void;
  onViewPdf: (pr: PurchaseRequestWithRelations) => void;
  onEdit: (pr: PurchaseRequestWithRelations) => void;
  onDelete: (id: string) => void;
}