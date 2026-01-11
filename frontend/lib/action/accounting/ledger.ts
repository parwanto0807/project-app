"use server";

import { LedgerResponse, GeneralLedgerResponse } from "@/schemas/accounting/ledger";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function getLedgers(params: {
    periodId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<LedgerResponse> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return {
                success: false,
                data: [],
            };
        }

        const queryParams = new URLSearchParams();
        if (params.periodId) queryParams.append("periodId", params.periodId);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);
        if (params.search) queryParams.append("search", params.search);
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());

        const res = await fetch(`${API_URL}/api/accounting/ledger?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            console.error("Fetch Ledgers Error:", await res.text());
            return { success: false, data: [] };
        }

        return await res.json();
    } catch (error) {
        console.error("Get Ledgers Exception:", error);
        return { success: false, data: [] };
    }
}

export async function getGeneralLedgerLines(params: {
    periodId?: string;
    startDate?: string;
    endDate?: string;
    coaId?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<GeneralLedgerResponse> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return {
                success: false,
                data: [],
            };
        }

        const queryParams = new URLSearchParams();
        if (params.periodId) queryParams.append("periodId", params.periodId);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);
        if (params.coaId) queryParams.append("coaId", params.coaId);
        if (params.search) queryParams.append("search", params.search);
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());

        const res = await fetch(`${API_URL}/api/accounting/ledger/general/lines?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            console.error("Fetch GL Error:", await res.text());
            return { success: false, data: [] };
        }

        return await res.json();

    } catch (error) {
        console.error("Get GL Exception:", error);
        return { success: false, data: [] };
    }
}

export async function getGeneralLedgerPostings(params: {
    periodId?: string;
    startDate?: string;
    endDate?: string;
    coaId?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<GeneralLedgerResponse> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return {
                success: false,
                data: [],
            };
        }

        const queryParams = new URLSearchParams();
        if (params.periodId) queryParams.append("periodId", params.periodId);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);
        if (params.coaId) queryParams.append("coaId", params.coaId);
        if (params.search) queryParams.append("search", params.search);
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());

        const res = await fetch(`${API_URL}/api/accounting/ledger/general/postings?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            console.error("Fetch Postings Error:", await res.text());
            return { success: false, data: [] };
        }

        return await res.json();

    } catch (error) {
        console.error("Get Postings Exception:", error);
        return { success: false, data: [] };
    }
}
