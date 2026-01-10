"use client";

import { GLSummaryResponse } from "@/types/glSummary";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getGLSummaries(query: string = ""): Promise<GLSummaryResponse> {
    try {
        const res = await fetch(`${API_URL}/api/accounting/gl-summary/getAll${query}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal mengambil data summary buku besar");
        return await res.json();
    } catch (error) {
        console.error("getGLSummaries error:", error);
        throw error;
    }
}

export async function getGLSummaryByCoa(coaId: string, query: string = ""): Promise<{ success: boolean, data: any[] }> {
    try {
        const res = await fetch(`${API_URL}/api/accounting/gl-summary/coa/${coaId}${query}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal mengambil detail summary akun");
        return await res.json();
    } catch (error) {
        console.error("getGLSummaryByCoa error:", error);
        throw error;
    }
}

export interface GrandTotalData {
    totalDebit: number;
    totalCredit: number;
    openingBalance: number;
    isBalanced: boolean;
    difference: number;
    aggregatedTotals: {
        debit: number;
        credit: number;
        opening: number;
        closing: number;
    };
    recordCount: number;
    calculatedAt: string;
}

export async function getGLGrandTotal(query: string = ""): Promise<{ success: boolean, data: GrandTotalData }> {
    try {
        const res = await fetch(`${API_URL}/api/accounting/gl-summary/grand-total${query}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal mengambil grand total");
        return await res.json();
    } catch (error) {
        console.error("getGLGrandTotal error:", error);
        throw error;
    }
}
