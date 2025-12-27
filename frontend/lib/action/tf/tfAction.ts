'use server';

import { revalidatePath } from 'next/cache';
import type {
    StockTransfer,
    CreateTransferInput,
    UpdateTransferStatusInput,
    TransferFilter
} from '@/types/tfType';
import { ApiResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse<T> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Create new stock transfer
 */
export async function createTransferAction(input: CreateTransferInput) {
    try {
        const result = await fetchAPI<StockTransfer>('/api/tf', {
            method: 'POST',
            body: JSON.stringify(input),
        });

        revalidatePath('/admin-area/inventory/transfer');
        return result;
    } catch (error: any) {
        return {
            success: false,
            data: undefined,
            error: error.message || 'Failed to create transfer'
        } as ApiResponse<StockTransfer>;
    }
}

/**
 * Get all transfers with filters
 */
export async function getTransfersAction(filters?: TransferFilter) {
    try {
        console.log('🔍 getTransfersAction called with filters:', filters);

        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, String(value));
                }
            });
        }

        const url = `/api/tf?${params.toString()}`;
        console.log('📡 Fetching from URL:', url);

        const result = await fetchAPI<{
            data: StockTransfer[];
            pagination: {
                page: number;
                limit: number;
                totalCount: number;
                totalPages: number;
            };
        }>(url);

        console.log('✅ getTransfersAction result:', result);
        return result;
    } catch (error: any) {
        console.error('❌ getTransfersAction error:', error);
        return {
            success: false,
            data: undefined,
            error: error.message || 'Failed to fetch transfers'
        } as ApiResponse<{
            data: StockTransfer[];
            pagination: {
                page: number;
                limit: number;
                totalCount: number;
                totalPages: number;
            };
        }>;
    }
}

/**
 * Get single transfer by ID
 */
export async function getTransferByIdAction(id: string) {
    try {
        const result = await fetchAPI<StockTransfer>(`/api/tf/${id}`);
        return result;
    } catch (error: any) {
        return {
            success: false,
            data: undefined,
            error: error.message || 'Failed to fetch transfer'
        } as ApiResponse<StockTransfer>;
    }
}

/**
 * Update transfer status
 */
export async function updateTransferStatusAction(
    id: string,
    input: UpdateTransferStatusInput
) {
    try {
        const result = await fetchAPI<StockTransfer>(`/api/tf/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(input),
        });

        revalidatePath('/admin-area/inventory/transfer');
        revalidatePath(`/admin-area/inventory/transfer/${id}`);
        return result;
    } catch (error: any) {
        return {
            success: false,
            data: undefined,
            error: error.message || 'Failed to update transfer status'
        } as ApiResponse<StockTransfer>;
    }
}

/**
 * Cancel transfer
 */
export async function cancelTransferAction(id: string) {
    try {
        const result = await fetchAPI<StockTransfer>(`/api/tf/${id}`, {
            method: 'DELETE',
        });

        revalidatePath('/admin-area/inventory/transfer');
        return result;
    } catch (error: any) {
        return {
            success: false,
            data: undefined,
            error: error.message || 'Failed to cancel transfer'
        } as ApiResponse<StockTransfer>;
    }
}

/**
 * Create GR manually for a transfer
 */
export async function createTransferGRAction(id: string) {
    try {
        const result = await fetchAPI<any>(`/api/tf/${id}/create-gr`, {
            method: 'POST',
        });

        revalidatePath('/admin-area/inventory/transfer');
        return result;
    } catch (error: any) {
        return {
            success: false,
            data: undefined,
            error: error.message || 'Failed to create GR'
        } as ApiResponse<any>;
    }
}
