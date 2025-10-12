// ENUM Types sesuai dengan backend
export enum CoaType {
  ASET = "ASET",
  LIABILITAS = "LIABILITAS",
  EKUITAS = "EKUITAS",
  PENDAPATAN = "PENDAPATAN",
  HPP = "HPP",
  BEBAN = "BEBAN",
}

export enum CoaNormalBalance {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

export enum CoaPostingType {
  HEADER = "HEADER",
  POSTING = "POSTING",
}

export enum CoaCashflowType {
  NONE = "NONE",
  OPERASIONAL = "OPERATING", // Map ke backend value
  INVESTASI = "INVESTING", // Map ke backend value
  PENDANAAN = "FINANCING", // Map ke backend value
}

export enum CoaStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  LOCKED = "LOCKED",
}

// Tax Rate Type
export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// COA Base Interface
export interface ChartOfAccounts {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CoaType;
  normalBalance: CoaNormalBalance;
  postingType: CoaPostingType;
  cashflowType: CoaCashflowType;
  status: CoaStatus;
  isReconcilable: boolean;
  defaultCurrency: string;
  parentId: string;
  taxRateId?: string;
  createdAt: string;
  updatedAt: string;
}

// COA dengan relasi lengkap - PERBAIKAN: tambahkan relasi yang digunakan di hooks
export interface ChartOfAccountsWithRelations extends ChartOfAccounts {
  parent?: {
    id: string;
    code: string;
    name: string;
    type?: CoaType;
  };
  children?: Array<{
    id: string;
    code: string;
    name: string;
    type: CoaType;
    status: CoaStatus;
    postingType?: CoaPostingType; // Ditambahkan untuk kebutuhan filter
  }>;
  taxRate?: {
    id: string;
    name: string;
    rate: number;
    isActive?: boolean; // Ditambahkan untuk kebutuhan display
  };
  journalLines?: Array<{
    id: string;
    debit: number;
    credit: number;
    journalEntry: {
      id: string;
      transactionDate: string;
      description: string;
    };
  }>;
  // Tambahkan relasi lain yang digunakan di hooks
  productsAsRevenue?: Array<{ id: string }>;
  productsAsCogs?: Array<{ id: string }>;
  productsAsInventory?: Array<{ id: string }>;
  paidFromAccount?: Array<{ id: string }>;
  expenseAccount?: Array<{ id: string }>;
}

// COA Hierarchy untuk tree structure
export interface CoaHierarchy extends ChartOfAccountsWithRelations {
  children?: CoaHierarchy[];
}

// Form Data untuk Create/Update COA - PERBAIKAN: buat optional fields benar-benar optional
export interface CoaFormData {
  code: string;
  name: string;
  description?: string;
  type: CoaType;
  normalBalance: CoaNormalBalance;
  postingType?: CoaPostingType;
  cashflowType?: CoaCashflowType;
  status?: CoaStatus;
  isReconcilable?: boolean;
  defaultCurrency?: string;
  parentId?: string | null; // Bisa null untuk clear parent
  taxRateId?: string | null; // Bisa null untuk clear tax rate
}

// Filter dan Pagination untuk COA - PERBAIKAN: tambahkan properti yang digunakan di hooks
export interface CoaFilter {
  page?: number;
  limit?: number;
  search?: string;
  type?: CoaType;
  status?: CoaStatus;
  postingType?: CoaPostingType;
  // Tambahan untuk kebutuhan advanced filtering
  normalBalance?: CoaNormalBalance;
  cashflowType?: CoaCashflowType;
  isReconcilable?: boolean;
  parentId?: string;
}

// Response dari API - SUDAH BAIK
export interface CoaListResponse {
  success: boolean;
  data: ChartOfAccountsWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CoaResponse {
  success: boolean;
  data: ChartOfAccountsWithRelations;
  message?: string;
}

export interface CoaHierarchyResponse {
  success: boolean;
  data: CoaHierarchy[];
}

// Option lists untuk dropdowns - SUDAH BAIK
export interface CoaTypeOption {
  value: CoaType;
  label: string;
}

export interface CoaNormalBalanceOption {
  value: CoaNormalBalance;
  label: string;
}

export interface CoaPostingTypeOption {
  value: CoaPostingType;
  label: string;
}

export interface CoaCashflowTypeOption {
  value: CoaCashflowType;
  label: string;
}

export interface CoaStatusOption {
  value: CoaStatus;
  label: string;
}

export interface CoaDeletionStatus {
  children?: Array<{ id: string }>;
  journalLines?: Array<{ id: string }>;
  productsAsRevenue?: Array<{ id: string }>;
  productsAsCogs?: Array<{ id: string }>;
  productsAsInventory?: Array<{ id: string }>;
  paidFromAccount?: Array<{ id: string }>;
  expenseAccount?: Array<{ id: string }>;
}

// ===== TYPE BARU YANG DIPERLUKAN OLEH HOOKS =====

// Type untuk COA statistics
export interface CoaStatistics {
  total: number;
  byType: Record<CoaType, number>;
  byPostingType: Record<CoaPostingType, number>;
  headerCount: number;
  postingCount: number;
  reconcilableCount: number;
}

// Type untuk bulk operations result
export interface BulkOperationResult {
  successful: number;
  failed: number;
}

// Type untuk COA option dalam dropdown
export interface CoaOption {
  value: string;
  label: string;
  data: ChartOfAccountsWithRelations;
}

// Type untuk form default values
export interface CoaFormDefaultValues {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  type?: CoaType;
  normalBalance?: CoaNormalBalance;
  postingType?: CoaPostingType;
  cashflowType?: CoaCashflowType;
  status?: CoaStatus;
  isReconcilable?: boolean;
  defaultCurrency?: string;
  parentId?: string;
  taxRateId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Type untuk mutation parameters
export interface UpdateCOAParams {
  id: string;
  data: Partial<CoaFormData>;
}

// Type untuk search results
export interface CoaSearchResult {
  results: ChartOfAccountsWithRelations[];
  isLoading: boolean;
  error: Error | null;
}

// Type untuk deletion check result
export interface CoaDeletionCheckResult {
  canDelete: boolean;
  deletionConstraints: string[];
  isLoading: boolean;
  error: Error | null;
  coa?: ChartOfAccountsWithRelations;
}

// Type untuk COA type utilities
export interface CoaTypeUtils {
  getTypeColor: (type: string) => string;
  getStatusColor: (status: string) => string;
  getNormalBalanceColor: (balance: string) => string;
  typeOptions: CoaTypeOption[];
  normalBalanceOptions: CoaNormalBalanceOption[];
  postingTypeOptions: CoaPostingTypeOption[];
  cashflowTypeOptions: CoaCashflowTypeOption[];
  statusOptions: CoaStatusOption[];
}

// Type untuk bulk operations
export interface CoaBulkOperations {
  bulkDeactivate: (ids: string[]) => Promise<BulkOperationResult>;
  bulkActivate: (ids: string[]) => Promise<BulkOperationResult>;
}

// Utility types untuk API responses
export interface ApiError {
  message: string;
  status?: number;
}

// Type untuk query results dengan pagination
export interface PaginatedQueryResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Type untuk COA dengan minimal data (untuk performance)
export interface CoaMinimal {
  id: string;
  code: string;
  name: string;
  type: CoaType;
  postingType: CoaPostingType;
  status: CoaStatus;
}

// Type untuk COA tree node
export interface CoaTreeNode {
  id: string;
  code: string;
  name: string;
  type: CoaType;
  postingType: CoaPostingType;
  status: CoaStatus;
  level: number;
  hasChildren: boolean;
  children?: CoaTreeNode[];
}

// Export semua types
export type {
  CoaFormData as CreateCoaInput,
  CoaFormData as UpdateCoaInput,
  CoaFilter as CoaFilterInput,
};
