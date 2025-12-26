"use server";

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
    CreatePurchaseOrderInput,
    UpdatePurchaseOrderInput,
    UpdatePurchaseOrderStatusInput,
    PurchaseOrderQueryParams,
    PurchaseOrderResponse,
    PurchaseOrderStatus,
    PurchaseOrder, // Import the complete PurchaseOrder type
} from '@/types/poType';
import { ApiResponse, ListResponse } from "@/types/api";
import { purchaseSchemas } from '@/schemas/po/poSchema';

// Base URL untuk API (sesuaikan dengan environment)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface POResponse {
    success: boolean;
    message?: string;
    data?: PurchaseOrder | PurchaseOrder[] | null;
    error?: string;
    details?: string;
    pagination?: {
        totalCount: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

interface POFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    supplierId?: string;
    projectId?: string;
}

// Helper to get headers with cookies
const getHeaders = async () => {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c: any) => `${c.name}=${c.value}`).join('; ');

    return {
        "Content-Type": "application/json",
        "Cookie": cookieHeader
    };
};

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
            const errorData = await response.json().catch(() => null);
            if (errorData) {
                if (typeof errorData.error === "string") {
                    const details = errorData.details ? ` (${errorData.details})` : "";
                    throw new Error(`${errorData.error}${details}`);
                } else if (typeof errorData.details === "string") {
                    throw new Error(errorData.details);
                } else if (errorData.message) {
                    throw new Error(errorData.message);
                }
            }
        }

        const text = await response.text();
        throw new Error(
            `HTTP error! status: ${response.status} - ${text || response.statusText}`
        );
    }
    return response.json();
}

// ==========================================================
//                 1. CREATE ACTIONS
// ==========================================================

/**
 * Create Purchase Order from an approved Purchase Request
 * This is called automatically when PR is approved
 * @param prId - The ID of the approved Purchase Request
 * @returns The created Purchase Order or null if no purchase items found
 */
export async function createPOFromPR(
    prId: string
): Promise<PurchaseOrder | null> {
    try {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/api/po/create-from-pr`, {
            method: "POST",
            credentials: "include",
            headers,
            body: JSON.stringify({ prId }),
        });

        const result: POResponse = await handleResponse(response);

        // Return null if no purchase items found (this is not an error)
        if (result.data === null) {
            return null;
        }

        // Handle both single object and array responses
        if (Array.isArray(result.data)) {
            return result.data[0] || null;
        }

        return result.data || null;
    } catch (error) {
        console.error("Error creating PO from PR:", error);
        throw error;
    }
}

/**
 * Create Purchase Order manually (from form)
 * @param data - Purchase Order data from form
 * @returns The created Purchase Order
 */
export async function createPurchaseOrder(data: {
    poNumber: string;
    supplierId: string;
    warehouseId: string;
    orderDate: Date;
    deliveryDate?: Date;
    projectId?: string;
    spkId?: string; // Added SPK ID
    paymentTerm?: string;
    notes?: string;
    items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
        taxRate?: number;
        notes?: string;
    }>;
    totalAmount: number;
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    status: 'DRAFT';
}): Promise<PurchaseOrder> {
    try {
        // Transform items to match backend expectations
        const lines = data.items.map(item => {
            const itemTotal = item.quantity * item.unitPrice;
            const itemDiscount = (itemTotal * (item.discount || 0)) / 100;
            const itemAfterDiscount = itemTotal - itemDiscount;
            const itemTax = (itemAfterDiscount * (item.taxRate || 0)) / 100;

            return {
                productId: item.productId,
                description: item.notes || '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalAmount: itemAfterDiscount + itemTax,
                discount: item.discount || 0,
                taxRate: item.taxRate || 0,
            };
        });

        const payload = {
            poNumber: data.poNumber,
            orderDate: data.orderDate.toISOString(),
            expectedDeliveryDate: data.deliveryDate?.toISOString() || null,
            warehouseId: data.warehouseId,
            supplierId: data.supplierId,
            projectId: data.projectId || null,
            spkId: data.spkId || null, // Added SPK ID
            paymentTerm: data.paymentTerm || 'NET_30',
            notes: data.notes || '',
            subtotal: data.subtotal,
            taxAmount: data.totalTax,
            totalAmount: data.totalAmount,
            status: data.status,
            lines,
        };

        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/api/po`, {
            method: "POST",
            credentials: "include",
            headers,
            body: JSON.stringify(payload),
        });

        const result: POResponse = await handleResponse(response);

        // Handle both single object and array responses
        if (Array.isArray(result.data)) {
            return result.data[0];
        }

        return result.data!;
    } catch (error) {
        console.error("Error creating PO:", error);
        throw error;
    }
}




// ==========================================================
//                 2. READ ACTIONS
// ==========================================================

/**
 * Get all Purchase Orders with pagination and filters
 */
export async function getAllPurchaseOrders(
    filters?: POFilters
): Promise<{ data: PurchaseOrder[]; pagination: any }> {
    try {
        const queryParams = new URLSearchParams();

        if (filters?.page) queryParams.append('page', filters.page.toString());
        if (filters?.limit) queryParams.append('limit', filters.limit.toString());
        if (filters?.search) queryParams.append('search', filters.search);
        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.supplierId) queryParams.append('supplierId', filters.supplierId);
        if (filters?.projectId) queryParams.append('projectId', filters.projectId);

        const url = `${API_BASE_URL}/api/po${queryParams.toString() ? `?${queryParams.toString()}` : ''
            }`;

        const headers = await getHeaders();
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers,
            cache: 'no-store',
        });

        const result: POResponse = await handleResponse(response);
        return {
            data: Array.isArray(result.data)
                ? result.data
                : result.data
                    ? [result.data]
                    : [],
            pagination: result.pagination ?? {
                currentPage: filters?.page ?? 1,
                pageSize: filters?.limit ?? 10,
                totalPages: 1,
                totalCount: 0,
                hasNext: false,
                hasPrev: false,
            },
        };
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        throw error;
    }
}

/**
 * Get Purchase Order detail by ID
 */
export async function getPurchaseOrderById(
    id: string
): Promise<PurchaseOrder> {
    try {
        const headers = await getHeaders();
        const response = await fetch(
            `${API_BASE_URL}/api/po/${id}`,
            {
                method: 'GET',
                headers,
                credentials: 'include',
                cache: 'no-store',
            }
        );

        const result: POResponse = await handleResponse(response);
        return Array.isArray(result.data) ? result.data[0] : result.data!;
    } catch (error) {
        console.error(`Error fetching purchase order ${id}:`, error);
        throw error;
    }
}

// ==========================================================
//                 3. UPDATE ACTIONS
// ==========================================================

/**
 * Update Purchase Order (only for DRAFT status)
 */
export async function updatePurchaseOrder(
    id: string,
    data: any
): Promise<PurchaseOrder> {
    try {
        const headers = await getHeaders();
        const response = await fetch(
            `${API_BASE_URL}/api/po/${id}`,
            {
                method: 'PUT',
                credentials: 'include',
                headers,
                body: JSON.stringify(data),
            }
        );

        const result: POResponse = await handleResponse(response);

        if (result.success) {
            revalidatePath('/purchase-orders');
            revalidatePath(`/purchase-orders/${id}`);
        }

        return Array.isArray(result.data) ? result.data[0] : result.data!;
    } catch (error) {
        console.error(`Error updating purchase order ${id}:`, error);
        throw error;
    }
}

/**
 * Update Purchase Order status
 */
export async function updatePurchaseOrderStatus(
    id: string,
    status: string
): Promise<PurchaseOrder> {
    try {
        const headers = await getHeaders();
        const response = await fetch(
            `${API_BASE_URL}/api/po/${id}/status`,
            {
                method: 'PATCH',
                credentials: 'include',
                headers,
                body: JSON.stringify({ status }),
            }
        );

        const result: POResponse = await handleResponse(response);

        if (result.success) {
            revalidatePath('/purchase-orders');
            revalidatePath(`/purchase-orders/${id}`);
        }

        return Array.isArray(result.data) ? result.data[0] : result.data!;
    } catch (error) {
        console.error(`Error updating purchase order status ${id}:`, error);
        throw error;
    }
}

// ==========================================================
//                 4. DELETE ACTIONS
// ==========================================================

/**
 * Delete Purchase Order (only for DRAFT status)
 */
export async function deletePurchaseOrder(id: string): Promise<void> {
    try {
        const headers = await getHeaders();
        const response = await fetch(
            `${API_BASE_URL}/api/po/${id}`,
            {
                method: 'DELETE',
                credentials: 'include',
                headers,
            }
        );

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({ error: 'Unknown error' }));
            throw new Error(
                errorData.error || `HTTP error! status: ${response.status}`
            );
        }

        revalidatePath('/purchase-orders');
    } catch (error) {
        console.error(`Error deleting purchase order ${id}:`, error);
        throw error;
    }

    // Redirect must be called outside of try-catch block
    redirect('/admin-area/logistic/purchasing');
}

/**
 * Send Purchase Order Email
 */
export async function sendPurchaseOrderEmail(
    id: string,
    formData: FormData
): Promise<any> {
    try {
        const headers = await getHeaders();
        // Remove Content-Type to allow fetch to automatically set it for FormData (multipart/form-data with boundary)
        const { 'Content-Type': _, ...authHeaders } = headers;

        const response = await fetch(
            `${API_BASE_URL}/api/po/${id}/send-email`,
            {
                method: 'POST',
                headers: authHeaders,
                body: formData,
            }
        );

        return await handleResponse(response);
    } catch (error) {
        console.error(`Error sending email for purchase order ${id}:`, error);
        throw error;
    }
}