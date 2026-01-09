"use server";

import { TrialBalanceResponse } from "@/schemas/accounting/trialBalance";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function getTrialBalance(
    periodId: string,
    search?: string,
    coaType?: string
): Promise<TrialBalanceResponse> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        console.log("[TB] Fetching trial balance for period:", periodId);
        console.log("[TB] Token exists:", !!token);

        if (!token) {
            console.error("[TB] No access token found");
            return {
                success: false,
                message: "Unauthorized - No access token",
                data: [],
                totals: {} as any,
                period: {} as any,
            };
        }

        const queryParams = new URLSearchParams({
            periodId,
            ...(search && { search }),
            ...(coaType && { coaType }),
        });

        const url = `${API_URL}/api/accounting/trial-balance?${queryParams}`;
        console.log("[TB] Fetching from:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            next: { revalidate: 0 }, // Disable cache for accounting data
        });

        console.log("[TB] Response status:", response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[TB] Response not OK:", errorText);
            return {
                success: false,
                message: `HTTP ${response.status}: ${errorText}`,
                data: [],
                totals: {} as any,
                period: {} as any,
            };
        }

        const result = await response.json();
        console.log("[TB] Success:", result.success, "Data count:", result.data?.length || 0);

        return result;
    } catch (error: any) {
        console.error("[TB] Fetch error:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch trial balance",
            data: [],
            totals: {} as any,
            period: {} as any,
        };
    }
}

export async function recalculateTrialBalance(periodId: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return { success: false, message: "Unauthorized" };
        }

        const response = await fetch(`${API_URL}/api/accounting/trial-balance/recalculate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ periodId }),
        });

        return await response.json();
    } catch (error: any) {
        return {
            success: false,
            message: error.message || "Failed to recalculate trial balance",
        };
    }
}
