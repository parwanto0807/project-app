// types/stockOpname.ts

// Enums (Harus sama dengan Prisma)
export enum OpnameType {
    INITIAL = 'INITIAL',
    PERIODIC = 'PERIODIC',
    AD_HOC = 'AD_HOC'
}

export enum OpnameStatus {
    DRAFT = 'DRAFT',
    ADJUSTED = 'ADJUSTED',
    CANCELLED = 'CANCELLED'
}

// Entity Types
export interface StockOpnameItem {
    id: string;
    stockOpnameId: string;
    productId: string;
    stokSistem: number;
    stokFisik: number;
    selisih: number;
    hargaSatuan: number;
    totalNilai: number;
    catatanItem?: string | null;
    product?: {
        name: string;
        code: string;
        storageUnit?: string;
    };
}

export interface StockOpname {
    id: string;
    nomorOpname: string;
    tanggalOpname: string; // ISO date string
    type: OpnameType;
    status: OpnameStatus;
    keterangan?: string | null;
    petugasId: string;
    warehouseId: string;
    petugas?: {
        name: string;
    };
    warehouse?: {
        id: string;
        name: string;
        code: string;
    };
    items: StockOpnameItem[];
    createdAt: string;
    updatedAt: string;
}

// Response Types
export interface StockOpnameListResponse {
    data: StockOpname[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface StockOpnameSummary {
    totalOpname: number;
    totalItems: number;
    totalNilai: number;
    byStatus: Record<OpnameStatus, number>;
    byType: Record<OpnameType, number>;
}

export interface StockOpnameFilterInput {
    page?: number;
    limit?: number;
    search?: string;
    status?: OpnameStatus | string;
    warehouseId?: string;
    startDate?: string;
    endDate?: string;
    type?: OpnameType | string;
}