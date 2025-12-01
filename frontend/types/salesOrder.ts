import { PurchaseRequest } from "./pr";

export type OrderType = "REGULAR" | "SUPPORT";

export type OrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "IN_PROGRESS_SPK"
  | "FULFILLED"
  | "BAST"
  | "PARTIALLY_INVOICED"
  | "INVOICED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED";

export type ItemType = "PRODUCT" | "SERVICE" | "CUSTOM";

export type DocType =
  | "QUOTATION"
  | "PO"
  | "SPK"
  | "BAP"
  | "INVOICE"
  | "PAYMENT_RECEIPT";

// ================== RELATED INTERFACES ==================

export interface Customer {
  id: string;
  name: string;
  address?: string;
  branch?: string | null;
  contactPerson?: string | null;
  // tambahkan field lain sesuai schema Customer
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  // tambahkan field lain sesuai schema Project
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  // tambahkan field lain sesuai schema User
}

export interface SalesOrderItem {
  id: string;
  salesOrderId?: string;

  lineNo: number; // urutan baris unik per SO
  itemType: ItemType;

  // Snapshot & relasi product (optional untuk SERVICE/CUSTOM)
  productId?: string | null;
  product?: { id: string; name: string } | null;

  name: string; // snapshot nama saat input
  description?: string | null;
  uom?: string | null;

  qty: number; // 4 desimal di DB; FE pakai number
  unitPrice: number; // 2 desimal di DB
  discount: number; // nominal, 2 desimal
  tax?: number;
  total: number;
  type: ItemType;
  lineTotal: number; // total baris (exclusive tax formula)
}

export interface SalesOrderDocument {
  id: string;
  salesOrderId?: string;
  docType: DocType;
  docNumber?: string | null;
  docDate?: string | null; // ISO string
  fileUrl?: string | null;
  url: string;
  meta?: unknown | null;
  createdAt: string; // ISO string
  uploadedAt: string; // ISO string
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  salesOrderId: string;
  total: number;
  status: string; // bisa dibuat enum kalau sudah fixed
  issuedDate: string;
  dueDate: string;
}

export interface SPK {
  id: string;
  salesOrderId: string;
  spkNumber: string;
  date: string;
  purchaseRequest: PurchaseRequest[];
}

export interface BAP {
  id: string;
  salesOrderId: string;
  bapNumber: string;
  date: string;
}

// ================== MAIN INTERFACE ==================

export interface SalesOrder {
  id: string;
  soNumber: string;
  soDate: Date;

  customerId: string;
  projectId: string;
  userId: string;

  type: OrderType;
  status: OrderStatus;
  isTaxInclusive: boolean;
  currency: string;

  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;

  notes?: string;

  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // relations
  customer?: Customer;
  project?: Project;
  user?: User;

  items?: SalesOrderItem[];
  documents?: SalesOrderDocument[];
  invoices?: Invoice[];
  spk?: SPK[];
  bap?: BAP[];
}
