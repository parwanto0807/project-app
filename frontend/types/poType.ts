// Enums
export enum PurchaseOrderStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    REVISION_NEEDED = "REVISION_NEEDED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    SENT = "SENT",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    FULLY_RECEIVED = "FULLY_RECEIVED",
    CANCELLED = "CANCELLED"
}

export enum SupplierInvoiceStatus {
    DRAFT = "DRAFT",
    REVISION_NEEDED = "REVISION_NEEDED",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    AWAITING_PAYMENT = "AWAITING_PAYMENT",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    FULLY_PAID = "FULLY_PAID",
    OVERDUE = "OVERDUE",
    CANCELLED = "CANCELLED"
}

export enum SupplierPaymentMethod {
    BANK_TRANSFER = "BANK_TRANSFER",
    CASH = "CASH",
    CHEQUE = "CHEQUE",
    VIRTUAL_ACCOUNT = "VIRTUAL_ACCOUNT"
}

export enum PaymentTermPurchaseOrder {
    CASH = "CASH",
    COD = "COD",
    NET_7 = "NET_7",
    NET_14 = "NET_14",
    NET_30 = "NET_30",
    DP_PERCENTAGE = "DP_PERCENTAGE"
}

// Base Types
export interface PurchaseOrderLine {
    id: string;
    productId: string;
    product?: Product; // Optional relation
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    receivedQuantity: number;
    prDetailId?: string | null;
    prDetail?: PurchaseRequestDetail | null; // Optional relation
    poId: string;
    purchaseOrder?: PurchaseOrder; // Optional relation
    grItems?: GoodsReceiptItem[]; // Optional relation
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    orderDate: Date;
    expectedDeliveryDate?: Date | null;
    notes?: string | null; // Added field
    status: PurchaseOrderStatus;
    warehouseId: string;
    warehouse?: Warehouse; // Optional relation
    supplierId: string;
    supplier?: Supplier; // Optional relation
    projectId?: string | null;
    project?: Project | null; // Optional relation
    orderedById: string;
    orderedBy?: Karyawan; // Optional relation
    paymentTerm: PaymentTermPurchaseOrder;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    lines: PurchaseOrderLine[];
    goodsReceipts?: GoodsReceipt[]; // Optional relation
    supplierInvoices?: SupplierInvoice[]; // Optional relation
    createdAt: Date;
    updatedAt: Date;
    SPK?: SPK | null; // Optional relation
    sPKId?: string | null;
    PurchaseRequest?: PurchaseRequest | null; // Optional relation
    purchaseRequestId?: string | null;
    teamId?: string | null;
    team?: Team | null; // Optional relation
    PurchaseExecution?: PurchaseExecution[]; // Optional relation
    relatedMRs?: RelatedMR[]; // Virtual field from controller
}

export interface Team {
    id: string;
    namaTeam: string;
    deskripsi?: string;
    karyawan?: {
        karyawan: Karyawan;
    }[];
}

export interface RelatedMR {
    id: string;
    mrNumber: string;
    status: string;
}

// Purchase Execution / Reports
export interface PurchaseExecution {
    id: string;
    executionDate: Date | string; // Often comes as string from JSON
    totalSpent: number;
    status: string;
    notes?: string;
    receipts?: PurchaseReceipt[];
    executor?: {
        id: string;
        namaLengkap: string;
    };
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface PurchaseReceipt {
    id: string;
    receiptNumber?: string;
    storeName?: string;
    receiptDate: Date | string;
    totalAmount: number;
    paymentMethod: string;
    items: ReceiptItem[];
    photos: ReceiptPhoto[];
}

export interface ReceiptItem {
    id: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    poLineId?: string;
}

export interface ReceiptPhoto {
    id: string;
    photoUrl: string;
    photoType: string; // BON, PRODUCT
}

// Related Types (these should be defined in your actual application)
export interface Warehouse {
    id: string;
    name: string;
    code: string;
    address?: string;
    isWip?: boolean;
    // Add other warehouse fields
}

export interface Supplier {
    id: string;
    name: string;
    code: string;
    billingAddress?: string;
    shippingAddress?: string;
    phone?: string;
    email?: string;
    // Add other supplier fields
}

export interface Project {
    id: string;
    name: string;
    // Add other project fields
}

export interface Karyawan {
    id: string;
    namaLengkap: string;
    jabatan?: string;
    // Add other karyawan fields
}

export interface Product {
    id: string;
    sku?: string;
    name: string;
    unit?: string;
    purchaseUnit?: string;
    // Add other product fields
}

export interface PurchaseRequestDetail {
    id: string;
    // Add other PR detail fields
}

export interface GoodsReceipt {
    id: string;
    // Add other goods receipt fields
}

export interface GoodsReceiptItem {
    id: string;
    // Add other goods receipt item fields
}

export interface SupplierInvoice {
    id: string;
    alamat: string;
    contact: string;
    // Add other supplier invoice fields
}

export interface SPK {
    id: string;
    spkNumber: string;
    // Add other SPK fields
}

export interface PurchaseRequest {
    id: string;
    nomorPr: string;
    spkId?: string | null;
    // Add other purchase request fields as needed
}

// Input/Request Types
export interface CreatePurchaseOrderInput {
    poNumber: string;
    orderDate: Date;
    expectedDeliveryDate?: Date | null;
    warehouseId: string;
    supplierId: string;
    projectId?: string | null;
    orderedById: string;
    paymentTerm?: PaymentTermPurchaseOrder;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    sPKId?: string | null;
    purchaseRequestId?: string | null;
    lines: CreatePurchaseOrderLineInput[];
}

export interface CreatePurchaseOrderLineInput {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    prDetailId?: string | null;
}

export interface UpdatePurchaseOrderInput {
    expectedDeliveryDate?: Date | null;
    status?: PurchaseOrderStatus;
    warehouseId?: string;
    projectId?: string | null;
    paymentTerm?: PaymentTermPurchaseOrder;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    lines?: UpdatePurchaseOrderLineInput[];
}

export interface UpdatePurchaseOrderLineInput {
    id?: string; // For updating existing lines
    productId?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    totalAmount?: number;
    receivedQuantity?: number;
    prDetailId?: string | null;
}

export interface UpdatePurchaseOrderStatusInput {
    status: PurchaseOrderStatus;
}

// Query/Filter Types
export interface PurchaseOrderQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: PurchaseOrderStatus;
    supplierId?: string;
    projectId?: string;
    warehouseId?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: 'orderDate' | 'poNumber' | 'totalAmount' | 'expectedDeliveryDate';
    sortOrder?: 'asc' | 'desc';
}

export interface PurchaseOrderResponse {
    data: PurchaseOrder[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}