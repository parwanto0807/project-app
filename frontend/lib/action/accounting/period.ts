
"use server";

import { revalidatePath } from "next/cache";
import { CreatePeriodFormValues, UpdatePeriodFormValues } from "@/schemas/accounting/period";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function handleResponse(res: Response) {
    if (!res.ok) {
        let errorMessage = `Error ${res.status}: ${res.statusText}`;
        try {
            const json = await res.json();
            errorMessage = json.message || errorMessage;
        } catch (e) {
            try {
                const text = await res.text();
                if (text) errorMessage = text;
            } catch (e2) { }
        }
        throw new Error(errorMessage);
    }

    try {
        return await res.json();
    } catch (e) {
        return {};
    }
}

async function fetchWithLog(url: string, options: RequestInit) {
    console.log(`[DEBUG] Fetching: ${url}`);

    const res = await fetch(url, {
        ...options,
        credentials: "include"
    });

    if (!res.ok) {
        console.error(`[DEBUG] Failed: ${res.status} ${res.statusText}`);
        try {
            const clone = res.clone();
            const text = await clone.text();
            console.error(`[DEBUG] Body: ${text}`);
        } catch (e) {
            console.error("[DEBUG] Could not read error body");
        }
    }

    return handleResponse(res);
}

// Helper to construct URL - following invoice.ts pattern or ensuring /api exists
function getUrl(path: string) {
    // If API_BASE_URL includes /api at the end, and we append /api... double api?
    // Based on logs, API_BASE_URL is 'http://localhost:5000'.
    // So we need to append '/api/accounting/ periods'.
    // But if API_BASE_URL is 'http://localhost:5000/api', we get /api/api...

    // To be safe, we check.
    const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
    // But wait, if path starts with api?
    // Let's just follow invoice.ts pattern: assume BASE is host, append /api/...
    // But API_BASE_URL variable definition in invoice.ts defaults to .../api

    // Simplest fix for the observed issue:
    // If API_BASE_URL doesn't end in /api, append /api.

    let base = API_BASE_URL;
    /* 
       User Logs show: http://localhost:5000/accounting/periods -- missing /api
       So API_BASE_URL = http://localhost:5000.
    */

    // We want: http://localhost:5000/api/accounting/periods
    return `${base}/api${path}`;
}

export async function getPeriods(params: any = {}) {
    const qs = new URLSearchParams();
    Object.keys(params).forEach(key => {
        if (params[key]) qs.append(key, params[key]);
    });

    // We add /api prefix here explicitly
    return fetchWithLog(`${API_BASE_URL}/api/accounting/periods?${qs.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
    });
}

export async function getPeriodById(id: string) {
    return fetchWithLog(`${API_BASE_URL}/api/accounting/periods/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
    });
}

export async function createPeriod(data: CreatePeriodFormValues) {
    const result = await fetchWithLog(`${API_BASE_URL}/api/accounting/periods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    revalidatePath("/admin-area/accounting/accounting-period");
    return result;
}

export async function updatePeriod(id: string, data: UpdatePeriodFormValues) {
    const result = await fetchWithLog(`${API_BASE_URL}/api/accounting/periods/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    revalidatePath("/admin-area/accounting/accounting-period");
    return result;
}

export async function closePeriod(id: string) {
    const result = await fetchWithLog(`${API_BASE_URL}/api/accounting/periods/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });
    revalidatePath("/admin-area/accounting/accounting-period");
    return result;
}

export async function reopenPeriod(id: string, reason: string) {
    const result = await fetchWithLog(`${API_BASE_URL}/api/accounting/periods/${id}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
    });
    revalidatePath("/admin-area/accounting/accounting-period");
    return result;
}
