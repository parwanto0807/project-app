"use server";

import { cookies } from "next/headers";
import type { StaffBalanceResponse, StaffLedgerResponse } from "@/types/staffBalance";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Get all staff balances with pagination and filters
 */
export async function getStaffBalances(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
}): Promise<StaffBalanceResponse> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("connect.sid");

        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.category) queryParams.append("category", params.category);
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

        const response = await fetch(
            `${API_BASE_URL}/api/staff-balance?${queryParams.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : "",
                },
                credentials: "include",
                cache: "no-store",
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch staff balances: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching staff balances:", error);
        throw error;
    }
}

/**
 * Get staff balance by employee ID
 */
export async function getStaffBalanceByKaryawan(karyawanId: string) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("connect.sid");

        const response = await fetch(
            `${API_BASE_URL}/api/staff-balance/karyawan/${karyawanId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : "",
                },
                credentials: "include",
                cache: "no-store",
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch staff balance: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching staff balance:", error);
        throw error;
    }
}

/**
 * Get staff ledger (transaction history) by employee ID
 */
export async function getStaffLedgerByKaryawan(
    karyawanId: string,
    params: {
        page?: number;
        limit?: number;
        category?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
    } = {}
): Promise<StaffLedgerResponse> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("connect.sid");

        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.category) queryParams.append("category", params.category);
        if (params.type) queryParams.append("type", params.type);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);

        const response = await fetch(
            `${API_BASE_URL}/api/staff-balance/ledger/${karyawanId}?${queryParams.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : "",
                },
                credentials: "include",
                cache: "no-store",
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch staff ledger: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching staff ledger:", error);
        throw error;
    }
}

/**
 * Get summary statistics for all staff balances
 */
export async function getStaffBalanceSummary() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("connect.sid");

        const response = await fetch(
            `${API_BASE_URL}/api/staff-balance/summary`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : "",
                },
                credentials: "include",
                cache: "no-store",
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch staff balance summary: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching staff balance summary:", error);
        throw error;
    }
}

/**
 * Create opening balance for staff
 */
export async function createOpeningBalance(data: {
    karyawanId: string;
    category: string;
    amount: number;
    tanggal?: string;
    keterangan?: string;
}) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("connect.sid");

        const response = await fetch(
            `${API_BASE_URL}/api/staff-balance/opening-balance`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : "",
                },
                credentials: "include",
                body: JSON.stringify(data),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to create opening balance");
        }

        return result;
    } catch (error) {
        console.error("Error creating opening balance:", error);
        throw error;
    }
}

/**
 * Process Staff Refund (Staff returns money to company)
 */
export async function processStaffRefundAction(data: {
    karyawanId: string;
    category: string;
    amount: number;
    coaId: string;
    tanggal?: string;
    keterangan?: string;
    refId?: string;
}) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("connect.sid");

        const response = await fetch(
            `${API_BASE_URL}/api/staff-balance/refund`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : "",
                },
                credentials: "include",
                body: JSON.stringify(data),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Gagal memproses pengembalian dana");
        }

        return result;
    } catch (error) {
        console.error("Error processing staff refund action:", error);
        throw error;
    }
}

/**
 * Settle PR Budget (Refund or Reimburse)
 */
export async function settlePRBudgetAction(prId: string) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("connect.sid");

        const response = await fetch(
            `${API_BASE_URL}/api/staff-balance/settle-pr`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : "",
                },
                credentials: "include",
                body: JSON.stringify({ prId }),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Gagal memproses settlement budget");
        }

        return result;
    } catch (error) {
        console.error("Error settling PR budget action:", error);
        throw error;
    }
}

