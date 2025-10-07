import { SalesOrder } from "@/schemas";

export enum QuotationStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  REVIEW = "REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum LineType {
  PRODUCT = "PRODUCT",
  SERVICE = "SERVICE",
  CUSTOM = "ALL",
}

export enum DiscountType {
  PERCENT = "PERCENT",
  AMOUNT = "AMOUNT",
}
export interface QuotationQueryParams {
  page?: number;
  limit?: number;
  status?: QuotationStatus;
  customerId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateUntil?: string;
}

// Response type untuk getQuotations
export interface QuotationListResponse {
  data: QuotationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Payload types untuk QuotationHistory
export interface QuotationHistoryPayload {
  id: string;
  quotationNumber: string;
  version: number;
  customerId: string;
  currency: string;
  exchangeRate: number;
  status: QuotationStatus;
  validFrom?: string | null;
  validUntil?: string | null;
  paymentTermId?: string | null;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  taxInclusive: boolean;
  taxTotal: number;
  otherCharges: number;
  total: number;
  notes?: string | null;
  preparedBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Atau jika payload bisa berisi perubahan partial
export interface QuotationChangePayload {
  changes: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  snapshot: QuotationHistoryPayload;
}

// Base Interfaces
export interface BaseQuotation {
  id: string;
  quotationNumber: string;
  version: number;
  customerId: string;
  currency: string;
  exchangeRate: number;
  status: QuotationStatus;
  validFrom?: string | null;
  validUntil?: string | null;
  paymentTermId?: string | null;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  taxInclusive: boolean;
  taxTotal: number;
  otherCharges: number;
  total: number;
  notes?: string | null;
  preparedBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationLine {
  id: string;
  quotationId: string;
  lineNo: number;
  lineType: LineType;
  productId?: string | null;
  description?: string | null;
  qty: number;
  uom?: string | null;
  unitPrice: number;
  lineDiscountType: DiscountType;
  lineDiscountValue: number;
  lineSubtotal: number;
  taxId?: string | null;
  taxAmount: number;
  lineTotal: number;
  createdAt: string;

  // Relations (optional)
  product?: Product;
  tax?: Tax;
}

// FIXED: QuotationHistory dengan type-safe payload
export interface QuotationHistory {
  id: string;
  quotationId: string;
  version: number;
  changedBy?: string | null;
  changeAt: string;
  changeNote?: string | null;
  payload: QuotationHistoryPayload | QuotationChangePayload; // JSON data dengan type yang jelas
}

export interface QuotationApproval {
  id: string;
  quotationId: string;
  approverId?: string | null;
  sequence: number;
  status: QuotationStatus;
  notes?: string | null;
  actedAt?: string | null;
}

export interface QuotationAttachment {
  id: string;
  quotationId: string;
  fileName: string;
  filePath: string;
  fileSize?: number | null;
  uploadedBy?: string | null;
  uploadedAt: string;
}

export interface QuotationComment {
  id: string;
  quotationId: string;
  commentedBy?: string | null;
  comment: string;
  createdAt: string;
}

// Related Types
export interface Customer {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  type: string;
  description?: string;
  price: number;
  uom?: string;
  isActive: boolean;
}

export interface Tax {
  id: string;
  code: string;
  name: string;
  description?: string;
  rate: number;
  isInclusive: boolean;
  isActive: boolean;
}

export interface PaymentTerm {
  id: string;
  code: string;
  name: string;
  description?: string;
  dueDays: number;
  isActive: boolean;
}

// Full Quotation with Relations
export interface Quotation extends BaseQuotation {
  customer: Customer;
  salesOrder: SalesOrder;
  paymentTerm?: PaymentTerm | null;
  lines: QuotationLine[];
  histories: QuotationHistory[];
  approvals: QuotationApproval[];
  attachments: QuotationAttachment[];
  comments: QuotationComment[];
}

export interface QuotationApiResponse {
    data: Quotation;
}

// Request/Response Types
export interface CreateQuotationRequest {
  customerId: string;
  quotationNumber?: string;
  salesOrderId?: string | null;
  currency?: string;
  exchangeRate?: number;
  status?: QuotationStatus;
  validFrom?: string | null;
  validUntil?: string | null;
  paymentTermId?: string | null;
  subtotal: number;
  discountType?: DiscountType;
  discountValue?: number;
  taxInclusive?: boolean;
  taxTotal: number;
  total:number;
  otherCharges?: number;
  notes?: string | null;
  preparedBy?: string | null;
  lines: CreateQuotationLineRequest[];
  autoGenerateNumber?: boolean;
}

export interface CreateQuotationLineRequest {
  lineType: LineType; // Ubah dari lineType?: LineType | undefined
  productId?: string | null;
  description?: string | null;
  qty: number;
  uom?: string | null;
  unitPrice: number;
  lineDiscountType: DiscountType; // Ubah dari lineDiscountType?: DiscountType | undefined
  lineDiscountValue?: number;
  taxId?: string | null;
  lineSubtotal: number;
}

export interface UpdateQuotationRequest
  extends Partial<CreateQuotationRequest> {
  version?: number;
}

export interface UpdateQuotationStatusRequest {
  status: QuotationStatus;
  notes?: string;
  actedBy: string;
}

export interface UploadAttachmentRequest {
  uploadedBy: string;
  file: File;
}

export interface AddCommentRequest {
  comment: string;
  commentedBy: string;
}

// Filter & Pagination Types
export interface QuotationFilter {
  status?: QuotationStatus;
  customerId?: string;
  search?: string;
  dateFrom?: string;
  dateUntil?: string;
}

export interface QuotationPagination {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
// Summary Types for Listing
export interface QuotationSummary {
  id: string;
  quotationNumber: string;
  version: number;
  customerId: string;
  customer: {
    id: string;
    name: string;
    code: string;
    email: string;
    address: string;
  };
  status: QuotationStatus;
  validFrom?: string | null;
  validUntil?: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    lines: number;
    attachments: number;
  };
  lines?: QuotationLine[];
}

// Calculation Results
export interface QuotationCalculation {
  subtotal: number;
  discountAmount: number;
  taxTotal: number;
  otherCharges: number;
  total: number;
  lines: QuotationLineCalculation[];
}

export interface QuotationLineCalculation {
  lineSubtotal: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

// Form Data Types
export interface QuotationFormData {
  customerId: string;
  currency: string;
  exchangeRate: number;
  status: QuotationStatus;
  validFrom?: string | null;
  validUntil?: string | null;
  paymentTermId?: string | null;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  taxInclusive: boolean;
  taxTotal: number;
  otherCharges: number;
  total: number;
  notes?: string | null;
  preparedBy?: string | null;
  lines: QuotationLineFormData[];
  autoGenerateNumber: boolean;
}

export interface QuotationLineFormData {
  lineType: LineType;
  productId?: string | null;
  description?: string | null;
  qty: number;
  uom?: string | null;
  unitPrice: number;
  lineDiscountType: DiscountType;
  lineDiscountValue: number;
  taxId?: string | null;
}

// Export for PDF/Print
export interface QuotationPrintData {
  quotation: Quotation;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
  preparedByUser?: {
    name: string;
    position: string;
  };
}

export interface BulkUpdateStatusParams {
  ids: string[];
  status: UpdateQuotationStatusRequest;
  actedBy: string;
  notes?: string;
}

// Type Guards untuk QuotationHistory payload
export const isQuotationHistoryPayload = (
  payload: unknown
): payload is QuotationHistoryPayload => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "quotationNumber" in payload &&
    "customerId" in payload &&
    "status" in payload
  );
};

export const isQuotationChangePayload = (
  payload: unknown
): payload is QuotationChangePayload => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "changes" in payload &&
    "snapshot" in payload
  );
};
