import { SalesOrder } from "@/lib/validations/sales-order";

export interface InvoiceItem {
  soItemId?: string | null;

  // Item details
  itemCode?: string | null;
  name: string;
  description?: string | null;
  uom?: string | null;

  // Quantity dan harga
  qty: number;
  unitPrice: number;
  discount?: number;
  discountPercent?: number;

  // Tax information
  taxRate?: number;
  taxCode?: string | null;
  taxable?: boolean;

  // Calculated fields
  lineTotal?: number;
  taxAmount?: number;
  netAmount?: number;
}

export interface Payment {
  id?: string;
  payDate: string;
  amount: number;
  method: "TRANSFER" | "CASH" | "CREDIT_CARD" | "VA" | "E_WALLET" | "CHEQUE";
  createdAt?: string;
}

export type InvoiceStatus =
  | "DRAFT"
  | "WAITING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  salesOrderId: string;
  dueDate: string;
  currency: string;
  exchangeRate: number;
  status: InvoiceStatus;
  bankAccountId: string;
  paymentTerm: string;
  installmentType: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  items: InvoiceItem[];
  payments?: Payment[];
  installments: Installment[];
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  clientName?: string;
  salesOrder: SalesOrder;
  approvedById: string;
  notes: string;
  internalNotes: string;
  termsConditions: string;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  approvalStatus: string;
  createdById: string;
  approvedBy: {
    namaLengkap: string;
    jabatan: string;
  };
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

export interface Installment {
  id?: string;
  invoiceId?: string;

  installmentNumber: number; // 1, 2, 3, ...
  name: string; // DP, After Installation, Final, dll

  // Amount details
  amount: number;
  percentage?: number | null;

  // Due date dan status
  dueDate: Date;
  status?: "PENDING" | "DUE_SOON" | "OVERDUE" | "PARTIALLY_PAID" | "PAID";

  // Tracking pembayaran
  paidAmount?: number;
  balance?: number;

  // Description
  description?: string | null;
  conditions?: string | null;

  createdAt?: Date;
  updatedAt?: Date;

  // Relations (opsional, tergantung apakah mau di-include atau tidak)
  payments?: Payment[];
}

export interface UpdateInvoiceRequest {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  salesOrderId?: string;
  currency: string;
  exchangeRate: number;
  bankAccountId?: string;
  paymentTerm?: string;
  installmentType: string; // Ubah dari "FULL" | "INSTALLMENT" menjadi string
  notes?: string;
  internalNotes?: string;
  termsConditions?: string;
  approvedById?: string;

  items?: Array<{
    soItemId?: string;
    itemCode?: string;
    name: string;
    description?: string;
    uom?: string;
    qty: number;
    unitPrice: number;
    discount: number;
    discountPercent?: number;
    taxRate: number;
    taxCode?: string;
    taxable: boolean;
  }>;

  installments?: Array<{
    installmentNumber: number;
    name: string;
    amount: number;
    percentage?: number | null;
    dueDate: string;
    description?: string | null;
    conditions?: string | null;
  }>;
}

export interface CreateInvoiceRequest {
  invoiceDate: string;
  dueDate: string;
  currency?: string;
  items?: Omit<InvoiceItem, "total">[];
  clientId?: string;
  approvedById?: string;
  bankAccountId?: string;
}

export interface UpdateInvoiceStatusRequest {
  status: InvoiceStatus;
}

export interface AddPaymentRequest {
  payDate: string; // Change from Date to string
  amount: number;
  method: string;
  bankAccountId?: string;
  reference: string;
  notes?: string;
  installmentId?: string;
  verifiedById?: string;
  accountCOAId?: string; // ✅ Added
  adminFee?: number;
}

export interface RejectInvoiceRequest {
  reason: string;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    invoiceCount: number;
  }>;
}

export interface PaginatedInvoices {
  success: boolean;
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}
