// lib/actions/stockOpnameActions.ts
import { api } from '@/lib/http';
import {
    ApiResponse,
    ListResponse
} from '@/types/api';

// Import atau definisikan tipe yang sesuai
import {
    StockOpname,
    StockOpnameItem,
    OpnameType,
    OpnameStatus
} from '@/types/soType';

// Tipe untuk payload create/update
export interface StockOpnameFormData {
    tanggalOpname: string;
    type: OpnameType;
    warehouseId: string;
    keterangan?: string;
    items: Array<{
        productId: string;
        stokFisik: number;
        hargaSatuan: number;
        stokSistem: number;
        catatanItem?: string;
    }>;
}

export type StockOpnameUpdateData = Partial<StockOpnameFormData>;

// Tipe untuk query params
export interface GetAllStockOpnameParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: OpnameStatus | string;
    warehouseId?: string;
    startDate?: string;
    endDate?: string;
    type?: OpnameType | string;
}

// Generate nomor opname (bisa pindah ke backend)
export const generateNomorOpname = (type: OpnameType): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);

    const typeCode = {
        [OpnameType.INITIAL]: 'INIT',
        [OpnameType.PERIODIC]: 'PER',
        [OpnameType.AD_HOC]: 'ADHOC'
    }[type];

    return `SO/${typeCode}/${year}${month}${day}/${timestamp}`;
};

export const stockOpnameActions = {
    /**
     * Mengambil semua data stock opname dengan pagination
     */
    getAll: async (params: GetAllStockOpnameParams = {}): Promise<ApiResponse<ListResponse<StockOpname>>> => {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            warehouseId = '',
            startDate = '',
            endDate = '',
            type = ''
        } = params;

        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());

        if (search) queryParams.append('search', search);
        if (status) queryParams.append('status', status);
        if (warehouseId) queryParams.append('warehouseId', warehouseId);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (type) queryParams.append('type', type);

        const response = await fetch(`/api/stock-opname?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch {
                // Jika response bukan JSON
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    },

    /**
     * Mengambil detail stock opname beserta items
     */
    getById: async (id: string): Promise<ApiResponse<StockOpname>> => {
        const response = await fetch(`/api/stock-opname/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch {
                // Jika response bukan JSON
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    },

    /**
     * Membuat stock opname baru (DRAFT)
     */
    create: async (payload: StockOpnameFormData): Promise<ApiResponse<StockOpname>> => {
        try {
            // Generate nomor opname jika tidak disediakan
            const dataToSend = {
                ...payload,
                nomorOpname: generateNomorOpname(payload.type)
            };

            const { data } = await api.post<ApiResponse<StockOpname>>('/api/stock-opname', dataToSend);
            return data;
        } catch (error: any) {
            console.error('Create stock opname error:', error);
            throw new Error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to create stock opname'
            );
        }
    },

    /**
     * Mengupdate stock opname (hanya DRAFT)
     */
    update: async (id: string, payload: Partial<StockOpnameFormData>): Promise<ApiResponse<StockOpname>> => {
        try {
            const { data } = await api.put<ApiResponse<StockOpname>>(`/api/stock-opname/${id}`, payload);
            return data;
        } catch (error: any) {
            console.error('Update stock opname error:', error);
            throw new Error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to update stock opname'
            );
        }
    },

    /**
     * Menghapus stock opname (hanya DRAFT)
     */
    delete: async (id: string): Promise<ApiResponse<null>> => {
        try {
            const { data } = await api.delete<ApiResponse<null>>(`/api/stock-opname/${id}`);
            return data;
        } catch (error: any) {
            console.error('Delete stock opname error:', error);
            throw new Error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to delete stock opname'
            );
        }
    },

    /**
     * Finalize stock opname (ADJUSTED)
     */
    adjust: async (id: string): Promise<ApiResponse<StockOpname>> => {
        try {
            const { data } = await api.patch<ApiResponse<StockOpname>>(`/api/stock-opname/${id}/adjust`);
            return data;
        } catch (error: any) {
            console.error('Adjust stock opname error:', error);
            throw new Error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to adjust stock opname'
            );
        }
    },

    /**
     * Cancel stock opname (CANCELLED)
     */
    cancel: async (id: string): Promise<ApiResponse<StockOpname>> => {
        try {
            const { data } = await api.patch<ApiResponse<StockOpname>>(`/api/stock-opname/${id}/cancel`);
            return data;
        } catch (error: any) {
            console.error('Cancel stock opname error:', error);
            throw new Error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to cancel stock opname'
            );
        }
    },

    /**
     * Get stock opname items by product
     */
    getItemsByProduct: async (productId: string, params: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
    } = {}): Promise<ApiResponse<ListResponse<StockOpnameItem>>> => {
        const {
            page = 1,
            limit = 10,
            startDate = '',
            endDate = ''
        } = params;

        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);

        const response = await fetch(`/api/stock-opname/product/${productId}/items?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch {
                // Jika response bukan JSON
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    },

    /**
     * Get stock opname summary statistics
     */
    getSummary: async (warehouseId?: string, startDate?: string, endDate?: string): Promise<ApiResponse<{
        totalOpname: number;
        totalItems: number;
        totalNilai: number;
        byStatus: Record<OpnameStatus, number>;
        byType: Record<OpnameType, number>;
    }>> => {
        const queryParams = new URLSearchParams();
        if (warehouseId) queryParams.append('warehouseId', warehouseId);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);

        const url = `/api/stock-opname/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch {
                // Jika response bukan JSON
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    },

    /**
     * Export stock opname to Excel/PDF
     */
    export: async (id: string, format: 'excel' | 'pdf' = 'excel'): Promise<Blob> => {
        try {
            const response = await api.get(`/api/stock-opname/${id}/export`, {
                params: { format },
                responseType: 'blob'
            });

            return response.data;
        } catch (error: any) {
            console.error('Export stock opname error:', error);
            throw new Error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to export stock opname'
            );
        }
    }
};