"use server";

import {
    SupplierInvoice,
    SupplierInvoiceListResponse,
    SupplierInvoiceResponse,
    CreateSupplierInvoiceInput,
    UpdateSupplierInvoiceInput,
    SupplierInvoiceQueryInput,
} from "@/types/supplierInvoice";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Generate next supplier invoice number
 */
export async function generateSupplierInvoiceNumber(): Promise<{ success: boolean; data: { invoiceNumber: string } }> {
    try {
        const response = await fetch(`${API_URL}/api/supplier-invoices/generate-number`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Failed to generate invoice number: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error generating invoice number:", error);
        throw error;
    }
}

/**
 * Get all supplier invoices with pagination and filters
 */
export async function getSupplierInvoices(
    query: SupplierInvoiceQueryInput = {}
): Promise<SupplierInvoiceListResponse> {
    try {
        const params = new URLSearchParams();

        if (query.page) params.append("page", query.page.toString());
        if (query.limit) params.append("limit", query.limit.toString());
        if (query.search) params.append("search", query.search);
        if (query.status) params.append("status", query.status);
        if (query.supplierId) params.append("supplierId", query.supplierId);
        if (query.startDate) params.append("startDate", query.startDate.toISOString());
        if (query.endDate) params.append("endDate", query.endDate.toISOString());

        const response = await fetch(`${API_URL}/api/supplier-invoices?${params}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch supplier invoices: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching supplier invoices:", error);
        throw error;
    }
}

/**
 * Get single supplier invoice by ID
 */
export async function getSupplierInvoiceById(id: string): Promise<SupplierInvoiceResponse> {
    try {
        const response = await fetch(`${API_URL}/api/supplier-invoices/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch supplier invoice: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching supplier invoice:", error);
        throw error;
    }
}

/**
 * Create new supplier invoice
 */
export async function createSupplierInvoice(
    data: CreateSupplierInvoiceInput
): Promise<SupplierInvoiceResponse> {
    try {
        const response = await fetch(`${API_URL}/api/supplier-invoices`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create supplier invoice");
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating supplier invoice:", error);
        throw error;
    }
}

/**
 * Update supplier invoice
 */
export async function updateSupplierInvoice(
    id: string,
    data: UpdateSupplierInvoiceInput
): Promise<SupplierInvoiceResponse> {
    try {
        const response = await fetch(`${API_URL}/api/supplier-invoices/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update supplier invoice");
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating supplier invoice:", error);
        throw error;
    }
}

/**
 * Update supplier invoice status
 */
export async function updateSupplierInvoiceStatus(
    id: string,
    status: string
): Promise<SupplierInvoiceResponse> {
    try {
        const response = await fetch(`${API_URL}/api/supplier-invoices/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update invoice status");
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating invoice status:", error);
        throw error;
    }
}

/**
 * Delete supplier invoice
 */
export async function deleteSupplierInvoice(id: string): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`${API_URL}/api/supplier-invoices/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to delete supplier invoice");
        }

        return await response.json();
    } catch (error) {
        console.error("Error deleting supplier invoice:", error);
        throw error;
    }
}

/**
 * Get invoice summary statistics
 */
export async function getInvoiceSummary(supplierId?: string) {
    try {
        const params = new URLSearchParams();
        if (supplierId) params.append("supplierId", supplierId);

        const response = await fetch(`${API_URL}/api/supplier-invoices/summary?${params}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error("Failed to fetch invoice summary");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching invoice summary:", error);
        throw error;
    }
}
