"use server";

import { FundTransfer, FundTransferRequest } from "@/types/finance/fundTransfer";
import { revalidatePath } from "next/cache";
import { getAuthHeaders, getCookieHeader } from "@/lib/cookie-utils";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api$/, "");
const API_BASE = `${BACKEND_URL}/api`;

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
    }
    return response.json();
}

export async function getFundTransfers(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<{
    success: boolean;
    data: FundTransfer[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.search) query.append("search", params.search);

    const authHeaders = await getAuthHeaders();
    const cookieHeader = await getCookieHeader();

    const response = await fetch(`${API_BASE}/finance/fund-transfer?${query}`, {
        method: "GET",
        headers: {
            ...authHeaders,
            "Cookie": cookieHeader
        },
    });

    return await handleResponse(response);
}

export async function getFundTransferById(id: string): Promise<{
    success: boolean;
    data: FundTransfer;
}> {
    const authHeaders = await getAuthHeaders();
    const cookieHeader = await getCookieHeader();

    const response = await fetch(`${API_BASE}/finance/fund-transfer/${id}`, {
        method: "GET",
        headers: {
            ...authHeaders,
            "Cookie": cookieHeader
        },
    });

    return await handleResponse(response);
}

export async function createFundTransfer(data: FundTransferRequest): Promise<{
    success: boolean;
    message: string;
    data: FundTransfer;
}> {
    const authHeaders = await getAuthHeaders();
    const cookieHeader = await getCookieHeader();

    const response = await fetch(`${API_BASE}/finance/fund-transfer`, {
        method: "POST",
        headers: {
            ...authHeaders,
            "Cookie": cookieHeader
        },
        body: JSON.stringify(data),
    });

    const result = await handleResponse<{
        success: boolean;
        message: string;
        data: FundTransfer;
    }>(response);

    revalidatePath("/admin-area/finance/fund-transfer");
    return result;
}

export async function voidFundTransfer(id: string, reason: string): Promise<{
    success: boolean;
    message: string;
    data: FundTransfer;
}> {
    const authHeaders = await getAuthHeaders();
    const cookieHeader = await getCookieHeader();

    const response = await fetch(`${API_BASE}/finance/fund-transfer/${id}/void`, {
        method: "POST",
        headers: {
            ...authHeaders,
            "Cookie": cookieHeader
        },
        body: JSON.stringify({ reason }),
    });

    const result = await handleResponse<{
        success: boolean;
        message: string;
        data: FundTransfer;
    }>(response);

    revalidatePath("/admin-area/finance/fund-transfer");
    return result;
}
