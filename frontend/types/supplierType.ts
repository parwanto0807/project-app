// ================================
// ENUM — Status Supplier

import { SupplierSchema } from "@/schemas/supplier/supplierSchema";
import z from "zod";

// ================================
export enum SupplierStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLACKLISTED = "BLACKLISTED",
}

// ================================
// Relational Detail Models
// ================================

export interface SupplierContact {
  id: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
}

export interface SupplierBankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branch?: string;
  isPrimary: boolean;
}

export interface SupplierCategoryInput {
  name: string;
  description?: string;
}

export interface SupplierCategory {
  id: string;
  name: string;
  description?: string;
}

// ================================
// Model Utama Supplier
// ================================
export interface Supplier {
  id: string;
  code: string;
  name: string;
  status: SupplierStatus;

  email?: string;
  phone?: string;
  website?: string;

  billingAddress?: string;
  shippingAddress?: string;

  npwp?: string;
  isTaxable: boolean;

  termOfPaymentId?: string;
  termOfPayment?: TermOfPayment;

  supplierCategoryId?: string;
  supplierCategory?: SupplierCategory;

  contacts?: SupplierContact[];
  bankAccounts?: SupplierBankAccount[];

  createdAt: string;
  updatedAt: string;
}

// ================================
// Input Create / Update
// ================================
export interface CreateSupplierInput {
  code: string;
  name: string;
  status?: SupplierStatus;

  email?: string;
  phone?: string;
  website?: string;
  billingAddress?: string;
  shippingAddress?: string;
  npwp?: string;
  isTaxable?: boolean;

  termOfPaymentId?: string;
  supplierCategoryId?: string;

  contacts?: SupplierContactInput[];
  bankAccounts?: SupplierBankAccountInput[];
}

export interface SupplierContactInput {
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface SupplierBankAccountInput {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branch?: string;
  isPrimary?: boolean;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

// ================================
// Pagination Response
// ================================
export interface SupplierMeta {
  page: number;
  limit: number;
  totalData: number;
  totalPage: number;
}

export interface ApiResponseBase {
  success: boolean;
  message?: string;
}

export interface SupplierPagination {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  totalCount: number;
}

export interface SupplierListResponse extends ApiResponseBase {
  data: Supplier[];
  meta: SupplierMeta;
  pagination: SupplierPagination;
}

export interface SupplierDetailResponse extends ApiResponseBase {
  data: Supplier;
}

export interface SupplierDeleteResponse extends ApiResponseBase {
  data?: Supplier;
}

export type SupplierFormValues = z.infer<typeof SupplierSchema>;

// Di supplierType.ts atau buat termPaymentType.ts
export interface TermOfPayment {
  id: string;
  name: string;
  days: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTermOfPaymentInput {
  name: string;
  days?: number;
  description?: string;
}

export interface UpdateTermOfPaymentInput
  extends Partial<CreateTermOfPaymentInput> {
  id: string;
}

export interface TermOfPaymentListResponse {
  success: boolean;
  data: TermOfPayment[];
}

export interface TermOfPaymentDetailResponse {
  success: boolean;
  data: TermOfPayment;
  message?: string;
}
