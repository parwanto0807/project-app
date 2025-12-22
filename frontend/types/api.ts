export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}

export interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ListResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  summary?: any;
}
