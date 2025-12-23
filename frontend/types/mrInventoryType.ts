import { ApiResponse, ListResponse } from './api'; // Asumsi file interface base Anda

export enum MRStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    READY_TO_PICKUP = "READY_TO_PICKUP",
    ISSUED = "ISSUED",
    CANCELLED = "CANCELLED"
}

export interface StockAllocation {
    id: string;
    mrItemId: string;
    stockDetailId: string;
    qtyTaken: number;
}

export interface MaterialRequisitionItem {
    id: string;
    materialRequisitionId: string;
    purchaseRequestDetailId?: string;
    productId: string;
    productName?: string; // Jika di-join dari backend
    qtyRequested: number;
    qtyIssued: number;
    unit: string;
    stockAllocations?: StockAllocation[];
}

export interface MaterialRequisition {
    id: string;
    mrNumber: string;
    qrToken: string;
    issuedDate: string;
    projectId: string;
    projectName?: string;
    requestedById: string;
    status: MRStatus;
    notes?: string;
    warehouseId?: string;
    preparedById?: string;
    issuedById?: string;
    items: MaterialRequisitionItem[];
    createdAt: string;
    updatedAt: string;
}

// Rekomendasi untuk Response API
export type MRListResponse = ListResponse<MaterialRequisition>;
export type MRDetailResponse = ApiResponse<MaterialRequisition>;