export type Product = {
    id: string;
    name: string;
    code: string;
    description?: string;
    type: string;
    purchaseUnit: string;
};

export type Supplier = {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
};

export type Project = {
    id: string;
    name: string;
    location?: string;
};

export type Warehouse = {
    id: string;
    name: string;
    address?: string;
};

export type Team = {
    id: string;
    namaTeam: string;
};

export type PurchaseOrderLine = {
    id: string;
    poId: string;
    productId: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    product: Product;
    receiptItems?: Array<{
        id: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        totalPrice: number;
        receipt?: {
            id: string;
            receiptNumber?: string;
            storeName?: string;
            receiptDate: string;
            totalAmount: number;
            execution?: {
                id: string;
                executionDate: string;
                status: string;
                executor?: {
                    id: string;
                    namaLengkap: string;
                };
            };
        };
        createdAt: string;
    }>;
};

export type PurchaseOrder = {
    id: string;
    poNumber: string;
    orderDate: string; // ISO Date string
    expectedDeliveryDate?: string;
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'REVISION_NEEDED' | 'APPROVED' | 'REJECTED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CANCELLED';
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    notes?: string;
    paymentTerm?: string; // e.g. COD, TOP 30 Days

    supplierId: string;
    supplier?: Supplier;

    projectId?: string;
    project?: Project;

    warehouseId: string;
    warehouse?: Warehouse;

    orderedBy?: {
        id: string;
        namaLengkap?: string;
    };

    teamId?: string;
    team?: Team;

    lines: PurchaseOrderLine[];
    PurchaseExecution?: Array<{
        id: string;
        status: string;
        totalSpent: number;
        createdAt: string;
    }>;
    PurchaseRequest?: {
        nomorPr: string;
        requestedBy?: {
            id: string;
            userId?: string;
            namaLengkap: string;
        };
        karyawan?: {
            id: string;
            userId?: string;
            namaLengkap: string;
        };
    };
    createdAt: string;
    updatedAt: string;
};

