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

export interface TopUsageItem {
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    category: string;
    warehouseId: string;
    warehouseName: string;
    stockOut: number;
    unit: string;
}

export async function getTopUsage(
    period: string,
    limit: number = 5,
    warehouseId?: string
): Promise<TopUsageItem[]> {
    try {
        const params: any = { period, limit };
        if (warehouseId && warehouseId !== 'all') {
            params.warehouseId = warehouseId;
        }

        const res = await serverApi.get<ApiResponse<TopUsageItem[]>>(
            '/api/inventory/top-usage',
            { params }
        );

        if (res.data && res.data.success) {
            return res.data.data || [];
        }
        return [];
    } catch (error) {
        console.error("Server Action Error [getTopUsage]:", error);
        return [];
    }
}

export interface TopValueItem {
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    category: string;
    warehouseId: string;
    warehouseName: string;
    inventoryValue: number;
    stockAkhir: number;
    unit: string;
}

export async function getTopValue(
    period: string,
    limit: number = 5,
    warehouseId?: string
): Promise<TopValueItem[]> {
    try {
        const params: any = { period, limit };
        if (warehouseId && warehouseId !== 'all') {
            params.warehouseId = warehouseId;
        }

        const res = await serverApi.get<ApiResponse<TopValueItem[]>>(
            '/api/inventory/top-value',
            { params }
        );

        if (res.data && res.data.success) {
            return res.data.data || [];
        }
        return [];
    } catch (error) {
        console.error("Server Action Error [getTopValue]:", error);
        return [];
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
    stockAkhirSnapshot: number;
    baseQty: number;
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

export interface StockOnPOItem {
    poNumber: string;
    poId: string;
    poDate: string;
    supplier: string;
    productName: string;
    productCode: string;
    unit: string;
    originalUnit: string;
    originalQtyRemaining: number;
    onPOQty: number;
    warehouseName: string;
    warehouseId?: string;
    status: string;
}

export async function getStockOnPO(
    productId: string,
    warehouseId?: string
): Promise<{ totalOnPO: number; onPOItems: StockOnPOItem[] }> {
    try {
        const params: any = { productId };
        if (warehouseId && warehouseId !== 'all') {
            params.warehouseId = warehouseId;
        }

        const res = await serverApi.get<ApiResponse<{ totalOnPO: number; onPOItems: StockOnPOItem[] }>>(
            '/api/inventory/on-po',
            { params }
        );

        if (res.data && res.data.success) {
            return res.data.data || { totalOnPO: 0, onPOItems: [] };
        }
        return { totalOnPO: 0, onPOItems: [] };
    } catch (error) {
        console.error("Server Action Error [getStockOnPO]:", error);
        return { totalOnPO: 0, onPOItems: [] };
    }
}

export interface StockOpnameExportItem {
    productName: string;
    productCode: string;
    stockSistem: number;
    satuan: string;
}

export interface StockOpnameExportGroup {
    warehouseId: string;
    warehouseName: string;
    items: StockOpnameExportItem[];
}

export async function getStockOpnameForPrint(params?: {
    warehouseId?: string;
    period?: string;
}): Promise<StockOpnameExportGroup[]> {
    try {
        const cleanParams: any = {
            limit: 100000,
            page: 1,
        };
        if (params?.warehouseId) cleanParams.warehouseId = params.warehouseId;
        if (params?.period) cleanParams.period = params.period;

        const res = await serverApi.get<ApiResponse<ListResponse<StockMonitoringItem>>>(
            '/api/inventory/monitoring',
            { params: cleanParams }
        );

        if (!res.data?.success || !res.data?.data?.data) return [];

        const items = res.data.data.data;

        const grouped = new Map<string, { warehouseName: string; items: StockOpnameExportItem[] }>();

        for (const item of items) {
            const whId = item.warehouseId;
            const whName = item.warehouse || whId;

            if (!grouped.has(whId)) {
                grouped.set(whId, { warehouseName: whName, items: [] });
            }

            const stockSistem = Number(item.stockAkhir || 0);

            grouped.get(whId)!.items.push({
                productName: item.name,
                productCode: item.code,
                stockSistem,
                satuan: item.storageUnit || '',
            });
        }

        const groups = Array.from(grouped.entries()).map(([id, g]) => ({
            warehouseId: id,
            warehouseName: g.warehouseName,
            items: g.items.sort((a, b) => a.productName.localeCompare(b.productName)),
        }));

        return groups.sort((a, b) => a.warehouseName.localeCompare(b.warehouseName));
    } catch (error) {
        console.error("Server Action Error [getStockOpnameForPrint]:", error);
        return [];
    }
}