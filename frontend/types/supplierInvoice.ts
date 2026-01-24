import { Product } from './poType';

export type SupplierInvoiceStatus =
    | 'DRAFT'
    | 'REVISION_NEEDED'
    | 'UNVERIFIED'
    | 'VERIFIED'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'POSTED'
    | 'AWAITING_PAYMENT'
    | 'PARTIALLY_PAID'
    | 'FULLY_PAID'
    | 'VOIDED'
    | 'CANCELLED'
    | 'OVERDUE'
    | 'DISPUTED'
    | 'WRITTEN_OFF';


export type PaymentMethod =
    | 'CASH'
    | 'BANK_TRANSFER'
    | 'CHECK'
    | 'CREDIT_CARD'
    | 'E_WALLET';

// ===================================================
// BASE ENTITIES
// ===================================================

export interface SupplierInvoice {
    id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    status: SupplierInvoiceStatus;

    // Relations
    supplierId: string;
    supplier?: Supplier;
    purchaseOrderId?: string | null;
    purchaseOrder?: PurchaseOrder | null;

    // Financial
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    amountPaid: number;

    // Items & Payments
    items?: SupplierInvoiceItem[];
    paymentAllocations?: PaymentAllocation[];

    // Accounting Integration
    journalEntryId?: string | null;
    journalEntry?: any;

    // Additional Information
    notes?: string | null;

    createdAt: Date;
    updatedAt: Date;
}

export interface SupplierInvoiceItem {
    id: string;
    supplierInvoiceId: string;
    supplierInvoice?: SupplierInvoice;

    productId: string;
    product?: Product;
    productName: string;
    productCode?: string;

    // Links to PO and Goods Receipt
    poLineId?: string | null;
    goodsReceivedItemId?: string | null;

    quantity: number;
    unitPrice: number;
    totalPrice: number;

    // Price Variance Tracking
    priceVariance: number;

    createdAt: Date;
}

export interface SupplierPayment {
    id: string;
    paymentNumber: string;
    paymentDate: Date;
    amount: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string | null;

    notes?: string | null;
    allocations?: PaymentAllocation[];

    createdAt: Date;
}

export interface PaymentAllocation {
    id: string;
    amount: number;

    supplierInvoiceId: string;
    supplierInvoice?: SupplierInvoice;

    supplierPaymentId: string;
    supplierPayment?: SupplierPayment;

    paymentVoucherId: string;
    paymentVoucher?: any;
}

// ===================================================
// RELATED TYPES
// ===================================================

export interface Supplier {
    id: string;
    name: string;
    code?: string;
    email?: string;
    phone?: string;
    address?: string;
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    orderDate: Date;
    totalAmount: number;
    PurchaseRequest?: {
        nomorPr: string;
    } | null;
}

// ===================================================
// INPUT TYPES
// ===================================================

export interface CreateSupplierInvoiceInput {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    supplierId: string;
    purchaseOrderId?: string | null;
    subtotal: number;
    taxAmount?: number;
    totalAmount: number;
    items?: CreateSupplierInvoiceItemInput[];
}

export interface CreateSupplierInvoiceItemInput {
    productId: string;
    productName: string;
    productCode?: string;
    poLineId?: string | null;
    goodsReceivedItemId?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    priceVariance?: number;
}

export interface UpdateSupplierInvoiceInput {
    invoiceNumber?: string;
    invoiceDate?: Date;
    dueDate?: Date;
    status?: SupplierInvoiceStatus;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
}

export interface CreateSupplierPaymentInput {
    paymentNumber: string;
    paymentDate?: Date;
    amount: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string | null;
    notes?: string | null;
    allocations?: CreatePaymentAllocationInput[];
}

export interface CreatePaymentAllocationInput {
    amount: number;
    supplierInvoiceId: string;
    paymentVoucherId: string;
}

export interface UpdateSupplierPaymentInput {
    paymentDate?: Date;
    paymentMethod?: PaymentMethod;
    bankAccountId?: string | null;
    notes?: string | null;
}

// ===================================================
// QUERY TYPES
// ===================================================

export interface SupplierInvoiceQueryInput {
    page?: number;
    limit?: number;
    search?: string;
    status?: SupplierInvoiceStatus;
    supplierId?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface SupplierPaymentQueryInput {
    page?: number;
    limit?: number;
    search?: string;
    paymentMethod?: PaymentMethod;
    startDate?: Date;
    endDate?: Date;
}

// ===================================================
// RESPONSE TYPES
// ===================================================

export interface SupplierInvoiceResponse {
    success: boolean;
    data: SupplierInvoice;
    message?: string;
}

export interface SupplierInvoiceListResponse {
    success: boolean;
    data: SupplierInvoice[];
    pagination: PaginationInfo;
}

export interface SupplierPaymentResponse {
    success: boolean;
    data: SupplierPayment;
    message?: string;
}

export interface SupplierPaymentListResponse {
    success: boolean;
    data: SupplierPayment[];
    pagination: PaginationInfo;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ===================================================
// FORM DATA TYPES
// ===================================================

export interface SupplierInvoiceFormData {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    supplierId: string;
    purchaseOrderId?: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    items: SupplierInvoiceItemFormData[];
}

export interface SupplierInvoiceItemFormData {
    productId: string;
    productName: string;
    productCode?: string;
    poLineId?: string;
    goodsReceivedItemId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    priceVariance?: number;
}

export interface SupplierPaymentFormData {
    paymentNumber: string;
    paymentDate: Date;
    amount: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    notes?: string;
    allocations: PaymentAllocationFormData[];
}

export interface PaymentAllocationFormData {
    amount: number;
    supplierInvoiceId: string;
    invoiceNumber?: string;
    paymentVoucherId: string;
}

// ===================================================
// UTILITY TYPES
// ===================================================

export interface SupplierInvoiceStatusOption {
    value: SupplierInvoiceStatus;
    label: string;
    color: string;
}

export interface PaymentMethodOption {
    value: PaymentMethod;
    label: string;
    icon?: string;
}

export interface InvoiceSummary {
    totalInvoices: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueCount: number;
}

export interface PaymentSummary {
    totalPayments: number;
    totalAmount: number;
    byMethod: Record<PaymentMethod, number>;
}

// ===================================================
// CONSTANTS
// ===================================================

export const SUPPLIER_INVOICE_STATUS_OPTIONS: { value: SupplierInvoiceStatus; label: string; color: string }[] = [
    { value: 'DRAFT', label: 'Draft', color: 'gray' },
    { value: 'REVISION_NEEDED', label: 'Revision Needed', color: 'orange' },
    { value: 'UNVERIFIED', label: 'Unverified', color: 'yellow' },
    { value: 'VERIFIED', label: 'Verified', color: 'blue' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'yellow' },
    { value: 'APPROVED', label: 'Approved', color: 'blue' },
    { value: 'POSTED', label: 'Posted', color: 'green' },
    { value: 'AWAITING_PAYMENT', label: 'Awaiting Payment', color: 'blue' },
    { value: 'PARTIALLY_PAID', label: 'Partially Paid', color: 'blue' },
    { value: 'FULLY_PAID', label: 'Fully Paid', color: 'green' },
    { value: 'VOIDED', label: 'Voided', color: 'red' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
    { value: 'OVERDUE', label: 'Overdue', color: 'red' },
    { value: 'DISPUTED', label: 'Disputed', color: 'orange' },
    { value: 'WRITTEN_OFF', label: 'Written Off', color: 'gray' },
];

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
    { value: 'CASH', label: 'Cash', icon: 'Banknote' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'Building' },
    { value: 'CHECK', label: 'Check', icon: 'FileText' },
    { value: 'CREDIT_CARD', label: 'Credit Card', icon: 'CreditCard' },
    { value: 'E_WALLET', label: 'E-Wallet', icon: 'Wallet' },
];
