"use server";

import { revalidatePath } from "next/cache";
import { getAuthHeaders, getCookieHeader } from "@/lib/cookie-utils";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api$/, "");
const API_BASE = `${BACKEND_URL}/api`;

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
            errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
    }
    return response.json();
}

export const getOperationalExpenses = async (params?: any) => {
    try {
        const query = new URLSearchParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined) query.append(key, params[key]);
            });
        }

        const authHeaders = await getAuthHeaders();
        const cookieHeader = await getCookieHeader();

        const response = await fetch(`${API_BASE}/finance/operational-expenses?${query}`, {
            method: "GET",
            headers: {
                ...authHeaders,
                "Cookie": cookieHeader
            },
        });

        const result = await handleResponse<any>(response);
        return { success: true, data: result.data || result };
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal mengambil data" };
    }
};

export const createOperationalExpense = async (formData: FormData) => {
    try {
        const authHeaders = await getAuthHeaders();
        const cookieHeader = await getCookieHeader();

        // 🟢 FIX: Remove Content-Type (case-insensitive) so fetch can set it with the correct boundary
        const headers: any = { ...authHeaders };
        delete headers["Content-Type"];
        delete headers["content-type"];

        const response = await fetch(`${API_BASE}/finance/operational-expenses`, {
            method: "POST",
            headers: {
                ...headers,
                "Cookie": cookieHeader,
            },
            body: formData
        });

        const result = await handleResponse<any>(response);
        revalidatePath("/admin-area/finance/operational-expenses");
        return { success: true, data: result.data || result };
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal membuat data" };
    }
};

export const updateOperationalExpense = async (id: string, formData: FormData) => {
    try {
        const authHeaders = await getAuthHeaders();
        const cookieHeader = await getCookieHeader();

        // 🟢 FIX: Remove Content-Type for multipart compatibility
        const headers: any = { ...authHeaders };
        delete headers["Content-Type"];
        delete headers["content-type"];

        const response = await fetch(`${API_BASE}/finance/operational-expenses/${id}`, {
            method: "PUT",
            headers: {
                ...headers,
                "Cookie": cookieHeader,
            },
            body: formData
        });

        const result = await handleResponse<any>(response);
        revalidatePath("/admin-area/finance/operational-expenses");
        return { success: true, data: result.data || result };
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal mengupdate data" };
    }
};

export const updateOperationalExpenseStatus = async (id: string, status: string, notes?: string) => {
    try {
        const authHeaders = await getAuthHeaders();
        const cookieHeader = await getCookieHeader();

        const response = await fetch(`${API_BASE}/finance/operational-expenses/${id}/status`, {
            method: "PATCH",
            headers: {
                ...authHeaders,
                "Cookie": cookieHeader,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status, notes })
        });

        const result = await handleResponse<any>(response);
        revalidatePath("/admin-area/finance/operational-expenses");
        return { success: true, data: result.data || result };
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal mengupdate status" };
    }
};

export const deleteOperationalExpense = async (id: string) => {
    try {
        const authHeaders = await getAuthHeaders();
        const cookieHeader = await getCookieHeader();

        const response = await fetch(`${API_BASE}/finance/operational-expenses/${id}`, {
            method: "DELETE",
            headers: {
                ...authHeaders,
                "Cookie": cookieHeader
            }
        });

        const result = await handleResponse<any>(response);
        revalidatePath("/admin-area/finance/operational-expenses");
        return { success: true, data: result.data || result };
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal menghapus data" };
    }
};
