// Enums
export enum QCStatus {
    PENDING = 'PENDING',
    ARRIVED = 'ARRIVED',
    PASSED = 'PASSED',
    REJECTED = 'REJECTED',
    PARTIAL = 'PARTIAL'
}

export enum ItemStatus {
    RECEIVED = 'RECEIVED',
    PARTIAL = 'PARTIAL',
    REJECTED = 'REJECTED'
}

export enum DocumentStatus {
    DRAFT = 'DRAFT',
    ARRIVED = 'ARRIVED',
    PASSED = 'PASSED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

// Base Interfaces
export interface BaseEntity {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
}

export interface Product {
    id: string;
    code: string;
    name: string;
    description?: string;
    unit?: string;
    category?: ProductCategory;
    stockQuantity?: number;
    specifications?: Record<string, any>;
}

export interface ProductCategory {
    id: string;
    name: string;
    code: string;
}

export interface Warehouse {
    id: string;
    code: string;
    name: string;
    location?: string;
    address?: string;
    capacity?: number;
}

export interface Vendor {
    id: string;
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    orderDate: Date;
    supplierId: string;
    supplier?: Vendor;
    status: string;
    totalAmount: number;
    items?: PurchaseOrderLine[];
}

export interface PurchaseOrderLine {
    id: string;
    purchaseOrderId: string;
    productId: string;
    product?: Product;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    receivedQuantity: number;
    rejectedQuantity: number;
    pendingQuantity: number;
    unit: string;
}

export interface PurchaseRequestDetail {
    id: string;
    purchaseRequestId: string;
    productId: string;
    product?: Product;
    quantity: number;
    unit: string;
}

export interface StockDetail {
    id: string;
    productId: string;
    product?: Product;
    warehouseId: string;
    warehouse?: Warehouse;
    quantity: number;
    unitPrice: number;
    totalValue: number;
    batchNumber: string;
    transactionType: string;
    transactionDate: Date;
    referenceId: string;
    referenceType: string;
    status: string;
    qcStatus?: QCStatus;
    notes?: string;
}

// Goods Receipt Interfaces
export interface GoodsReceiptItem extends BaseEntity {
    id: string;
    goodsReceiptId: string;
    productId: string;
    product: Product;
    status: ItemStatus;

    qtyPlanReceived: number; // Planned qty from PO
    qtyReceived: number;
    unit: string;

    // QC Results
    qtyPassed: number;
    qtyRejected: number;
    qcStatus: QCStatus;
    qcNotes?: string;

    // Relations
    stockDetailId?: string;
    stockDetail?: StockDetail;
    purchaseRequestDetailId?: string;
    purchaseRequestDetail?: PurchaseRequestDetail;
    purchaseOrderLineId?: string;
    purchaseOrderLine?: PurchaseOrderLine;
}

export interface GoodsReceipt extends BaseEntity {
    id: string;
    grNumber: string;
    receivedDate?: Date; // Optional: filled when materials actually arrive
    expectedDate?: Date; // From PO's expectedDeliveryDate

    // Physical Document References
    vendorDeliveryNote: string;
    vehicleNumber?: string;
    driverName?: string;

    // Relations
    purchaseOrderId?: string;
    purchaseOrder?: PurchaseOrder;
    warehouseId?: string;
    warehouse?: Warehouse;
    receivedById: string;
    receivedBy?: User;

    // Status
    sourceType?: string; // Should be SourceType enum but string is safer for now or import enum
    transferStatus?: string; // Status of linked StockTransfer (for TRANSFER sourceType)
    status: DocumentStatus;
    notes?: string;

    // Items
    items: GoodsReceiptItem[];

    // Metadata
    _count?: {
        items: number;
    };
}

// QC Summary Interfaces
export interface QCStatusCount {
    [QCStatus.PENDING]: number;
    [QCStatus.ARRIVED]: number;
    [QCStatus.PASSED]: number;
    [QCStatus.REJECTED]: number;
    [QCStatus.PARTIAL]: number;
}

export interface GoodsReceiptQCSummary {
    totalItems: number;
    totalReceived: number;
    totalPassed: number;
    totalRejected: number;
    passingRate: number;
    qcStatusCounts: QCStatusCount;
}

export interface GoodsReceiptWithQC extends GoodsReceipt {
    qcSummary: GoodsReceiptQCSummary;
}

// Filter Interfaces
export interface GoodsReceiptFilter {
    page?: number;
    limit?: number;
    sortBy?: keyof GoodsReceipt;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    status?: DocumentStatus;
    warehouseId?: string;
    purchaseOrderId?: string;
    qcStatus?: QCStatus;
    vendorId?: string;
}

export interface PendingQCFilter {
    page?: number;
    limit?: number;
}

// Request/Response DTOs
export interface CreateGoodsReceiptItemDTO {
    productId: string;
    qtyReceived: number;
    unit: string;
    qtyPassed?: number;
    qtyRejected?: number;
    qcStatus?: QCStatus;
    qcNotes?: string;
    purchaseOrderLineId?: string;
    purchaseRequestDetailId?: string;
}

export interface CreateGoodsReceiptDTO {
    grNumber: string;
    receivedDate?: Date | string;
    vendorDeliveryNote: string;
    vehicleNumber?: string;
    driverName?: string;
    purchaseOrderId: string;
    warehouseId: string;
    receivedById: string;
    notes?: string;
    items: CreateGoodsReceiptItemDTO[];
}

export interface UpdateGoodsReceiptDTO {
    grNumber?: string;
    receivedDate?: Date | string;
    vendorDeliveryNote?: string;
    vehicleNumber?: string;
    driverName?: string;
    purchaseOrderId?: string;
    warehouseId?: string;
    notes?: string;
    status?: DocumentStatus;
}

export interface UpdateQCItemDTO {
    itemId: string;
    qcStatus?: QCStatus;
    qtyPassed?: number;
    qtyRejected?: number;
    qcNotes?: string;
}

export interface UpdateQCDTO {
    items: UpdateQCItemDTO[];
}

// API Response Types
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

export interface GoodsReceiptListResponse extends ListResponse<GoodsReceipt> {
    summary?: {
        totalItems: number;
        totalQtyReceived: number;
        totalQtyPassed: number;
        totalQtyRejected: number;
        qcStatusDistribution: Array<{ qcStatus: QCStatus; count: number }>;
        passingRate: number;
    };
}

export interface PendingQCResponse extends ListResponse<GoodsReceiptItem> {
    summary?: {
        totalPendingItems: number;
    };
}

// Summary Statistics
export interface GoodsReceiptSummary {
    statusCounts: Array<{ status: DocumentStatus; count: number }>;
    qcStats: {
        totalItems: number;
        totalReceived: number;
        totalPassed: number;
        totalRejected: number;
        passingRate: number;
    };
    recentReceipts: GoodsReceipt[];
    monthlyTotal: number;
    totalGRs: number;
    topRejectedProducts: Array<{
        productId: string;
        productName: string;
        productCode: string;
        totalReceived: number;
        totalRejected: number;
        rejectionRate: number;
    }>;
}

// Dropdown/Select Options
export interface GoodsReceiptSelectOption {
    value: string;
    label: string;
    grNumber: string;
    date: Date;
    vendorName?: string;
}

export interface ProductSelectOption {
    value: string;
    label: string;
    code: string;
    unit: string;
    stockQuantity: number;
}

// Form Data Types
export interface GoodsReceiptFormData {
    grNumber: string;
    receivedDate: Date | string;
    vendorDeliveryNote: string;
    vehicleNumber: string;
    driverName: string;
    purchaseOrderId: string;
    warehouseId: string;
    receivedById: string;
    notes: string;
    items: GoodsReceiptItemFormData[];
}

export interface GoodsReceiptItemFormData {
    id?: string;
    productId: string;
    product?: Product;
    qtyPlanReceived: number;
    qtyReceived: number;
    unit: string;
    qtyPassed: number;
    qtyRejected: number;
    qcStatus: QCStatus;
    qcNotes: string;
    purchaseOrderLineId?: string;
    purchaseRequestDetailId?: string;
}

export interface QCFormData {
    itemId: string;
    productName: string;
    qtyReceived: number;
    qtyPassed: number;
    qtyRejected: number;
    qcStatus: QCStatus;
    qcNotes: string;
}

// Table Column Types
export interface GoodsReceiptTableColumn {
    id: keyof GoodsReceipt | 'actions' | 'vendorName' | 'warehouseName' | 'itemCount';
    label: string;
    align?: 'left' | 'right' | 'center';
    sortable?: boolean;
    width?: string;
}

export interface GoodsReceiptItemTableColumn {
    id: keyof GoodsReceiptItem | 'actions';
    label: string;
    align?: 'left' | 'right' | 'center';
    sortable?: boolean;
    width?: string;
}