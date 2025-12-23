export interface StockMonitoringItem {
    id: string;
    productId: string;
    code: string;
    name: string;
    category?: string;
    storageUnit: string;
    isActive: boolean;
    warehouse: string;
    warehouseId: string;
    stockAwal: number;
    stockIn: number;
    stockOut: number;
    justIn: number;
    justOut: number;
    onPR: number;
    bookedStock: number;
    stockAkhir: number;
    availableStock: number; // Added new field
    inventoryValue: number;
    updatedAt: string;
    status: 'SAFE' | 'WARNING' | 'CRITICAL';
}

export interface InventoryMonitoringResponse {
    success: boolean;
    data: StockMonitoringItem[];
    message?: string;
}
