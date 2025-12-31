'use server';

import { serverApi } from "@/lib/server-api";
import { ApiResponse, ListResponse } from "@/types/api";
import { StockMonitoringItem } from "@/types/inventoryType";

// Update interface agar menggunakan 'period' tunggal
export interface MonitoringParams {
    search?: string;
    warehouseId?: string;
    period?: string; // Format: "YYYY-MM"
    status?: string; // Status filter: 'CRITICAL', 'WARNING', 'SAFE', 'inactive'
    page?: number;
    limit?: number;
}

export async function getInventoryMonitoring(
    params: MonitoringParams
): Promise<ApiResponse<ListResponse<StockMonitoringItem>>> {
    try {
        // Membersihkan params (menghapus yang undefined/kosong)
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
        );

        const res = await serverApi.get<ApiResponse<ListResponse<StockMonitoringItem>>>(
            '/api/inventory/monitoring',
            { params: cleanParams }
        );

        return res.data;
    } catch (error: any) {
        console.error("Server Action Error [getInventoryMonitoring]:", error);

        return {
            success: false,
            message: "Gagal mengambil data monitoring stok",
            error: error.response?.data?.error || "SERVER_ERROR",
            details: error.message
        };
    }
}

export async function getAllWarehouses(): Promise<{ id: string; name: string; isMain: boolean; isWip: boolean }[]> {
    try {
        const res = await serverApi.get<any>(
            '/api/warehouse',
            { params: { limit: 100 } } // Ambil cukup banyak untuk mengisi dropdown
        );

        if (res.data && res.data.success && Array.isArray(res.data.data.data)) {
            // Return id, name, isMain, and isWip
            return res.data.data.data.map((w: any) => ({
                id: w.id,
                name: w.name,
                isMain: w.isMain,
                isWip: w.isWip || false
            }));
        }
        return [];
    } catch (error) {
        console.error("Server Action Error [getAllWarehouses]:", error);
        return [];
    }
}

export interface StockHistoryItem {
    id: string;
    date: string;
    type: "IN" | "OUT" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
    source: string;
    qty: number;
    unit: string;
    price: number;
    warehouse: string;
    notes: string;
    referenceNo: string;
}

export async function getStockHistory(
    productId: string,
    period: string,
    warehouseId?: string
): Promise<StockHistoryItem[]> {
    try {
        const params: any = { productId, period };
        if (warehouseId && warehouseId !== 'all') {
            params.warehouseId = warehouseId;
        }

        const res = await serverApi.get<ApiResponse<StockHistoryItem[]>>(
            '/api/inventory/history',
            { params }
        );

        if (res.data && res.data.success) {
            return res.data.data || [];
        }
        return [];
    } catch (error) {
        console.error("Server Action Error [getStockHistory]:", error);
        return [];
    }
}

export interface StockBookingItem {
    prNumber: string;
    prId: string;
    prDate: string;
    requestor: string;
    project: string;
    productName: string;
    productCode: string;
    unit: string;
    bookedQty: number;
    warehouseName: string;
    warehouseId?: string;
    totalRequested: number;
    jumlahTerpenuhi: number;
    status: string;
}

export async function getStockBookings(
    productId: string,
    warehouseId?: string
): Promise<{ totalBooked: number; bookings: StockBookingItem[] }> {
    try {
        const params: any = { productId };
        if (warehouseId && warehouseId !== 'all') {
            params.warehouseId = warehouseId;
        }

        const res = await serverApi.get<ApiResponse<{ totalBooked: number; bookings: StockBookingItem[] }>>(
            '/api/inventory/bookings',
            { params }
        );

        if (res.data && res.data.success) {
            return res.data.data || { totalBooked: 0, bookings: [] };
        }
        return { totalBooked: 0, bookings: [] };
    } catch (error) {
        console.error("Server Action Error [getStockBookings]:", error);
        return { totalBooked: 0, bookings: [] };
    }
}