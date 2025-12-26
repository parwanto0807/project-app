'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
    createGoodsReceiptSchema,
    updateGoodsReceiptSchema,
    updateQCSchema,
    goodsReceiptFilterSchema,
    type CreateGoodsReceiptDTO,
    type UpdateGoodsReceiptDTO,
    type UpdateQCDTO,
    type GoodsReceiptFilter,
    GoodsReceiptItem,
} from '@/schemas/wh/grInventorySchema';
import {
    QCStatus as QCStatusType,
    DocumentStatus as DocumentStatusType,
    GoodsReceiptListResponse
} from '@/types/grInventoryType';
import { ApiResponse } from '@/types/api';
import { GoodsReceipt } from '@/types/poType';
import { getPurchaseOrderById } from '@/lib/action/po/po';

// Base API URL
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
        console.error(`API Error (${endpoint}):`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            details: error instanceof Error ? error.stack : undefined
        };
    }
}

// ========== CRUD Operations ==========

/**
 * Create new Goods Receipt
 */
export async function createGoodsReceiptAction(
    formData: FormData
): Promise<{ success: boolean; message?: string; errors?: Record<string, string> }> {
    try {
        // Extract form data
        const rawData = {
            grNumber: formData.get('grNumber') as string,
            receivedDate: formData.get('receivedDate')
                ? new Date(formData.get('receivedDate') as string)
                : new Date(),
            vendorDeliveryNote: formData.get('vendorDeliveryNote') as string,
            vehicleNumber: formData.get('vehicleNumber') as string,
            driverName: formData.get('driverName') as string,
            purchaseOrderId: formData.get('purchaseOrderId') as string,
            warehouseId: formData.get('warehouseId') as string,
            receivedById: formData.get('receivedById') as string,
            notes: formData.get('notes') as string,
            items: JSON.parse(formData.get('items') as string || '[]')
        };

        // Validate with Zod
        const validatedData = createGoodsReceiptSchema.parse(rawData);

        // Transform to DTO
        const createDTO: CreateGoodsReceiptDTO = {
            ...validatedData,
            items: validatedData.items.map(item => ({
                ...item,
                qtyPassed: item.qtyPassed ?? item.qtyReceived,
                qtyRejected: item.qtyRejected ?? 0,
                qcStatus: item.qcStatus ?? QCStatusType.PENDING
            }))
        };

        // Send to API
        const result = await fetchAPI<GoodsReceiptListResponse>('/goods-receipts', {
            method: 'POST',
            body: JSON.stringify(createDTO),
        });

        if (result.success && result.data) {
            revalidatePath('/goods-receipts');
            revalidatePath('/dashboard');
            return {
                success: true,
                message: 'Goods receipt created successfully'
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to create goods receipt'
            };
        }
    } catch (error) {
        if (error instanceof Error && 'errors' in error) {
            // Zod validation errors
            const zodError = error as any;
            const fieldErrors: Record<string, string> = {};

            if (zodError.errors) {
                zodError.errors.forEach((err: any) => {
                    if (err.path) {
                        const path = err.path.join('.');
                        fieldErrors[path] = err.message;
                    }
                });
            }

            return {
                success: false,
                message: 'Validation failed',
                errors: fieldErrors
            };
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create goods receipt'
        };
    }
}

/**
 * Get all Goods Receipts with filtering
 */
export async function getGoodsReceiptsAction(
    filters: GoodsReceiptFilter = {}
): Promise<ApiResponse<GoodsReceiptListResponse>> {
    try {
        // Validate filters
        const validatedFilters = goodsReceiptFilterSchema.parse(filters);

        // Build query string
        const queryParams = new URLSearchParams();
        Object.entries(validatedFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (value instanceof Date) {
                    queryParams.append(key, value.toISOString());
                } else {
                    queryParams.append(key, String(value));
                }
            }
        });

        return await fetchAPI<GoodsReceiptListResponse>(`/api/gr?${queryParams}`);
    } catch (error) {
        console.error('Error fetching goods receipts:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch goods receipts'
        };
    }
}

/**
 * Get single Goods Receipt by ID
 */
export async function getGoodsReceiptByIdAction(
    id: string
): Promise<ApiResponse<GoodsReceipt>> {
    try {
        if (!id) {
            return {
                success: false,
                error: 'ID is required'
            };
        }

        return await fetchAPI<GoodsReceipt>(`/api/gr/${id}`);
    } catch (error) {
        console.error(`Error fetching goods receipt ${id}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch goods receipt'
        };
    }
}

/**
 * Update Goods Receipt
 */
export async function updateGoodsReceiptAction(
    id: string,
    formData: FormData
): Promise<{ success: boolean; message?: string; errors?: Record<string, string> }> {
    try {
        if (!id) {
            return {
                success: false,
                message: 'ID is required'
            };
        }

        // Extract form data
        const rawData: Record<string, any> = {};
        for (const [key, value] of formData.entries()) {
            if (key === 'receivedDate' && value) {
                rawData[key] = new Date(value as string);
            } else if (value) {
                rawData[key] = value;
            }
        }

        // Validate with Zod
        const validatedData = updateGoodsReceiptSchema.parse(rawData);

        // Send to API
        const result = await fetchAPI<GoodsReceipt>(`/api/gr/${id}`, {
            method: 'PUT',
            body: JSON.stringify(validatedData),
        });

        if (result.success) {
            revalidatePath('/goods-receipts');
            revalidatePath(`/goods-receipts/${id}`);
            return {
                success: true,
                message: 'Goods receipt updated successfully'
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to update goods receipt'
            };
        }
    } catch (error) {
        if (error instanceof Error && 'errors' in error) {
            // Zod validation errors
            const zodError = error as any;
            const fieldErrors: Record<string, string> = {};

            if (zodError.errors) {
                zodError.errors.forEach((err: any) => {
                    if (err.path) {
                        const path = err.path.join('.');
                        fieldErrors[path] = err.message;
                    }
                });
            }

            return {
                success: false,
                message: 'Validation failed',
                errors: fieldErrors
            };
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update goods receipt'
        };
    }
}

/**
 * Delete Goods Receipt
 */
export async function deleteGoodsReceiptAction(
    id: string
): Promise<{ success: boolean; message?: string }> {
    try {
        if (!id) {
            return {
                success: false,
                message: 'ID is required'
            };
        }

        const result = await fetchAPI(`/api/gr/${id}`, {
            method: 'DELETE',
        });

        if (result.success) {
            revalidatePath('/goods-receipts');
            revalidatePath('/dashboard');
            return {
                success: true,
                message: 'Goods receipt deleted successfully'
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to delete goods receipt'
            };
        }
    } catch (error) {
        console.error(`Error deleting goods receipt ${id}:`, error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete goods receipt'
        };
    }
}

// ========== QC Operations ==========

/**
 * Update QC Status for Goods Receipt items
 */
export async function updateQCAction(
    goodsReceiptId: string,
    formData: FormData
): Promise<{ success: boolean; message?: string; errors?: Record<string, string> }> {
    try {
        if (!goodsReceiptId) {
            return {
                success: false,
                message: 'Goods Receipt ID is required'
            };
        }

        // Extract items data
        const itemsData = JSON.parse(formData.get('items') as string || '[]');

        // Validate with Zod
        const validatedData = updateQCSchema.parse({ items: itemsData });

        // Send to API
        const result = await fetchAPI<GoodsReceipt>(`/api/gr/${goodsReceiptId}/qc`, {
            method: 'PATCH',
            body: JSON.stringify(validatedData),
        });

        if (result.success) {
            revalidatePath('/goods-receipts');
            revalidatePath(`/goods-receipts/${goodsReceiptId}`);
            revalidatePath('/qc-pending');
            return {
                success: true,
                message: 'QC status updated successfully'
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to update QC status'
            };
        }
    } catch (error) {
        if (error instanceof Error && 'errors' in error) {
            // Zod validation errors
            const zodError = error as any;
            const fieldErrors: Record<string, string> = {};

            if (zodError.errors) {
                zodError.errors.forEach((err: any) => {
                    if (err.path) {
                        const path = err.path.join('.');
                        fieldErrors[path] = err.message;
                    }
                });
            }

            return {
                success: false,
                message: 'Validation failed',
                errors: fieldErrors
            };
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update QC status'
        };
    }
}

/**
 * Get items pending QC inspection
 */
export async function getPendingQCAction(
    filters: { page?: number; limit?: number } = {}
): Promise<ApiResponse<GoodsReceiptListResponse>> {
    try {
        const validatedFilters = goodsReceiptFilterSchema.parse(filters);

        const queryParams = new URLSearchParams();
        Object.entries(validatedFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        return await fetchAPI<GoodsReceiptListResponse>(`/api/gr/pending-qc?${queryParams}`);
    } catch (error) {
        console.error('Error fetching pending QC items:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch pending QC items'
        };
    }
}

// ========== Special Operations ==========

/**
 * Get Goods Receipts by Purchase Order ID
 */
export async function getGoodsReceiptsByPOAction(
    purchaseOrderId: string,
    filters: { page?: number; limit?: number } = {}
): Promise<ApiResponse<GoodsReceiptListResponse>> {
    try {
        if (!purchaseOrderId) {
            return {
                success: false,
                error: 'Purchase Order ID is required'
            };
        }

        const validatedFilters = goodsReceiptFilterSchema.parse(filters);

        const queryParams = new URLSearchParams();
        Object.entries(validatedFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        return await fetchAPI<GoodsReceiptListResponse>(
            `/api/gr/purchase-order/${purchaseOrderId}?${queryParams}`
        );
    } catch (error) {
        console.error(`Error fetching GR by PO ${purchaseOrderId}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch goods receipts'
        };
    }
}

/**
 * Validate GR Number availability
 */
export async function validateGRNumberAction(
    grNumber: string
): Promise<ApiResponse<{ available: boolean; grNumber: string }>> {
    try {
        if (!grNumber) {
            return {
                success: false,
                error: 'GR Number is required'
            };
        }

        return await fetchAPI<{ available: boolean; grNumber: string }>(
            `/api/gr/validate/${encodeURIComponent(grNumber)}`
        );
    } catch (error) {
        console.error('Error validating GR number:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to validate GR number'
        };
    }
}

/**
 * Get Goods Receipt summary statistics
 */
export async function getGoodsReceiptSummaryAction(
    filters: {
        startDate?: Date | string;
        endDate?: Date | string;
        warehouseId?: string;
    } = {}
): Promise<ApiResponse<any>> {
    try {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (value instanceof Date) {
                    queryParams.append(key, value.toISOString());
                } else {
                    queryParams.append(key, String(value));
                }
            }
        });

        return await fetchAPI<any>(`/api/gr/summary?${queryParams}`);
    } catch (error) {
        console.error('Error fetching GR summary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch summary'
        };
    }
}

// ========== Utility Functions ==========

/**
 * Generate next GR number
 */
export async function generateNextGRNumberAction(): Promise<ApiResponse<{ nextNumber: string }>> {
    try {
        // Call the backend API to generate the next GR number
        return await fetchAPI<{ nextNumber: string }>('/api/gr/generate-number');
    } catch (error) {
        console.error('Error generating next GR number:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate GR number'
        };
    }
}

/**
 * Create Goods Receipt automatically from Purchase Order (CLIENT-SIDE)
 * This is used when PO status changes to SENT
 * NOTE: This is NOT a server action - it runs client-side to allow fetch to localhost
 */
export async function createGoodsReceiptFromPOAction(
    purchaseOrderId: string,
    receivedById?: string
): Promise<{ success: boolean; message?: string; grNumber?: string }> {
    try {
        if (!purchaseOrderId) {
            return {
                success: false,
                message: 'Purchase Order ID is required'
            };
        }



        console.log('Creating GR from PO:', purchaseOrderId, 'ReceivedBy:', receivedById);

        // Call backend endpoint directly (client-side fetch)
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/gr/from-po/${purchaseOrderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ receivedById }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('GR creation failed:', errorData);
            return {
                success: false,
                message: errorData.error || `HTTP error! status: ${response.status}`
            };
        }

        const result = await response.json();
        console.log('GR creation result:', result);

        if (result.success && result.data) {
            return {
                success: true,
                message: 'Goods Receipt created successfully',
                grNumber: result.data.grNumber
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to create goods receipt'
            };
        }
    } catch (error) {
        console.error('Error creating GR from PO:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create goods receipt from PO'
        };
    }
}

// Note: Utility functions like calculateQCSummary and validateGoodsReceiptCompletion
// have been moved to @/lib/utils/grUtils.ts to avoid Server Action constraints

// ========== Export Functions ==========

/**
 * Export Goods Receipt to CSV
 */
export async function exportGoodsReceiptsToCSVAction(
    filters: GoodsReceiptFilter = {}
): Promise<{ success: boolean; data?: string; message?: string }> {
    try {
        const result = await getGoodsReceiptsAction({
            ...filters,
            limit: 1000 // Get all records for export
        });

        if (!result.success || !result.data || !result.data.data) {
            return {
                success: false,
                message: result.error || 'Failed to fetch data for export'
            };
        }

        // Convert to CSV
        const headers = [
            'GR Number',
            'Received Date',
            'Vendor Delivery Note',
            'Vendor',
            'Warehouse',
            'Status',
            'Total Items',
            'Total Received',
            'Total Passed',
            'Total Rejected',
            'Passing Rate'
        ];

        const rows = result.data.data.map(gr => [
            gr.grNumber,
            gr.receivedDate ? new Date(gr.receivedDate).toLocaleDateString() : 'N/A',
            gr.vendorDeliveryNote,
            gr.PurchaseOrder?.supplier?.name || 'N/A',
            gr.Warehouse?.name || 'N/A',
            gr.status,
            gr.items.length,
            gr.items.reduce((sum, item) => sum + item.qtyReceived, 0),
            gr.items.reduce((sum, item) => sum + item.qtyPassed, 0),
            gr.items.reduce((sum, item) => sum + item.qtyRejected, 0),
            `${((gr.items.reduce((sum, item) => sum + item.qtyPassed, 0) /
                gr.items.reduce((sum, item) => sum + item.qtyReceived, 0) * 100) || 0).toFixed(2)}%`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return {
            success: true,
            data: csvContent
        };
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to export data'
        };
    }
}

// ========== Workflow Actions ==========

/**
 * Mark goods as arrived - Update GR when physical goods arrive
 */
export async function markGoodsArrivedAction(
    grId: string,
    data: {
        receivedDate: Date;
        vendorDeliveryNote?: string;
        vehicleNumber?: string;
        driverName?: string;
        items: { id: string; qtyReceived: number }[];
    }
): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
        if (!grId) {
            return {
                success: false,
                message: 'GR ID is required'
            };
        }

        const result = await fetchAPI<any>(`/api/gr/${grId}/arrived`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });

        if (result.success) {
            revalidatePath('/admin-area/inventory/goods-receipt');
            revalidatePath(`/admin-area/inventory/goods-receipt/${grId}`);
            return {
                success: true,
                message: 'Goods marked as arrived successfully',
                data: result.data
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to mark goods as arrived'
            };
        }
    } catch (error) {
        console.error('Error marking goods as arrived:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to mark goods as arrived'
        };
    }
}

/**
 * Record QC Check results
 */
export async function recordQCCheckAction(
    grId: string,
    data: {
        items: {
            id: string;
            qtyPassed: number;
            qtyRejected: number;
            qcNotes?: string;
        }[];
    }
): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
        if (!grId) {
            return {
                success: false,
                message: 'GR ID is required'
            };
        }

        const result = await fetchAPI<any>(`/api/gr/${grId}/qc-check`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });

        if (result.success) {
            revalidatePath('/admin-area/inventory/goods-receipt');
            revalidatePath(`/admin-area/inventory/goods-receipt/${grId}`);
            return {
                success: true,
                message: 'QC check recorded successfully',
                data: result.data
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to record QC check'
            };
        }
    } catch (error) {
        console.error('Error recording QC check:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to record QC check'
        };
    }
}

/**
 * Approve GR and update stock balance
 */
export async function approveGRAction(
    grId: string,
    data: {
        notes?: string;
    }
): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
        if (!grId) {
            return {
                success: false,
                message: 'GR ID is required'
            };
        }

        const result = await fetchAPI<any>(`/api/gr/${grId}/approve`, {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (result.success) {
            revalidatePath('/admin-area/inventory/goods-receipt');
            revalidatePath(`/admin-area/inventory/goods-receipt/${grId}`);
            revalidatePath('/dashboard');
            return {
                success: true,
                message: 'GR approved and stock updated successfully',
                data: result.data
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to approve GR'
            };
        }
    } catch (error) {
        console.error('Error approving GR:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to approve GR'
        };
    }
}