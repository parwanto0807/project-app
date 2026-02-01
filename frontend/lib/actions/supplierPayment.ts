"use server";

import {
    SupplierPayment,
    SupplierPaymentListResponse,
    SupplierPaymentResponse,
    CreateSupplierPaymentInput,
    UpdateSupplierPaymentInput,
    SupplierPaymentQueryInput,
} from "@/types/supplierInvoice";
import { format } from "date-fns";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Get all supplier payments with pagination and filters
 */
export async function getSupplierPayments(
    query: SupplierPaymentQueryInput = {}
): Promise<SupplierPaymentListResponse> {
    try {
        const params = new URLSearchParams();

        if (query.page) params.append("page", query.page.toString());
        if (query.limit) params.append("limit", query.limit.toString());
        if (query.search) params.append("search", query.search);
        if (query.paymentMethod) params.append("paymentMethod", query.paymentMethod);
        if (query.startDate) params.append("startDate", format(query.startDate, 'yyyy-MM-dd'));
        if (query.endDate) params.append("endDate", format(query.endDate, 'yyyy-MM-dd'));

        const response = await fetch(`${API_URL}/api/supplier-payments?${params}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch supplier payments: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching supplier payments:", error);
        throw error;
    }
}

/**
 * Get single supplier payment by ID
 */
export async function getSupplierPaymentById(id: string): Promise<SupplierPaymentResponse> {
    try {
        const response = await fetch(`${API_URL}/api/supplier-payments/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch supplier payment: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching supplier payment:", error);
        throw error;
    }
}

/**
 * Create new supplier payment
 */
export async function createSupplierPayment(
    data: CreateSupplierPaymentInput
): Promise<SupplierPaymentResponse> {
    try {
        const response = await fetch(`${API_URL}/api/supplier-payments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create supplier payment");
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating supplier payment:", error);
        throw error;
    }
}

/**
 * Update supplier payment
 */
export async function updateSupplierPayment(
    id: string,
    data: UpdateSupplierPaymentInput
): Promise<SupplierPaymentResponse> {
    try {
        const response = await fetch(`${API_URL}/api/supplier-payments/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update supplier payment");
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating supplier payment:", error);
        throw error;
    }
}

/**
 * Delete supplier payment
 */
export async function deleteSupplierPayment(id: string): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`${API_URL}/api/supplier-payments/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to delete supplier payment");
        }

        return await response.json();
    } catch (error) {
        console.error("Error deleting supplier payment:", error);
        throw error;
    }
}

/**
 * Generate next payment number
 */
export async function generatePaymentNumber(): Promise<{ success: boolean; data: { paymentNumber: string } }> {
    try {
        const response = await fetch(`${API_URL}/api/supplier-payments/generate-number`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error("Failed to generate payment number");
        }

        return await response.json();
    } catch (error) {
        console.error("Error generating payment number:", error);
        throw error;
    }
}

/**
 * Get payment summary statistics
 */
export async function getPaymentSummary(startDate?: Date, endDate?: Date) {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", format(startDate, 'yyyy-MM-dd'));
        if (endDate) params.append("endDate", format(endDate, 'yyyy-MM-dd'));

        const response = await fetch(`${API_URL}/api/supplier-payments/summary?${params}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error("Failed to fetch payment summary");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching payment summary:", error);
        throw error;
    }
}
