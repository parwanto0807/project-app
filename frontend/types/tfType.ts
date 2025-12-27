export type TransferStatus = 'DRAFT' | 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface StockTransferItem {
    id: string;
    transferId: string;
    productId: string;
    product?: {
        id: string;
        code: string;
        name: string;
        unit: string;
    };
    quantity: number;
    unit: string;
    notes?: string;
}

export interface StockTransfer {
    id: string;
    transferNumber: string;
    transferDate: string;
    status: TransferStatus;
    notes?: string;
    fromWarehouseId: string;
    fromWarehouse?: {
        id: string;
        code: string;
        name: string;
        address?: string;
    };
    toWarehouseId: string;
    toWarehouse?: {
        id: string;
        code: string;
        name: string;
        address?: string;
    };
    senderId: string;
    sender?: {
        id: string;
        name: string;
        user?: {
            name: string;
        };
    };
    receiverId?: string;
    receiver?: {
        id: string;
        name: string;
        user?: {
            name: string;
        };
    };
    items: StockTransferItem[];
    qrToken?: string;
    goodsReceiptId?: string;
    goodsReceiptStatus?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface CreateTransferInput {
    fromWarehouseId: string;
    toWarehouseId: string;
    senderId: string;
    notes?: string;
    items: {
        productId: string;
        quantity: number;
        unit: string;
        notes?: string;
    }[];
}

export interface UpdateTransferStatusInput {
    status: TransferStatus;
    receiverId?: string;
}

export interface TransferFilter {
    page?: number;
    limit?: number;
    search?: string;
    status?: TransferStatus;
    fromWarehouseId?: string;
    toWarehouseId?: string;
    startDate?: string;
    endDate?: string;
}
