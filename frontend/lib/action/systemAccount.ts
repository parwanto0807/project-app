"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiFetch";
import { SystemAccountFormData } from "@/types/accounting";

// NEXT_PUBLIC_API_URL typically is 'http://localhost:5000' without /api
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/accounting/system-accounts`;

export async function getSystemAccounts() {
    try {
        const data = await apiFetch(API_URL, {
            method: "GET",
        });
        return data;
    } catch (error: any) {
        console.error("[getSystemAccounts] Error:", error.message);
        return { success: false, message: error.message || "Failed to fetch system accounts" };
    }
}

export async function upsertSystemAccount(data: SystemAccountFormData) {
    try {
        const response = await apiFetch(`${API_URL}/upsert`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        revalidatePath("/admin-area/accounting/system-account");
        return response;
    } catch (error: any) {
        console.error("[upsertSystemAccount] Error:", error.message);
        return { success: false, message: error.message || "Failed to save system account" };
    }
}

export async function updateSystemAccount(id: string, data: Partial<SystemAccountFormData>) {
    try {
        const response = await apiFetch(`${API_URL}/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        revalidatePath("/admin-area/accounting/system-account");
        return response;
    } catch (error: any) {
        console.error("[updateSystemAccount] Error:", error.message);
        return { success: false, message: error.message || "Failed to update system account" };
    }
}

export async function deleteSystemAccount(id: string) {
    try {
        const response = await apiFetch(`${API_URL}/${id}`, {
            method: "DELETE",
        });

        revalidatePath("/admin-area/accounting/system-account");
        return response;
    } catch (error: any) {
        console.error("[deleteSystemAccount] Error:", error.message);
        return { success: false, message: error.message || "Failed to delete system account" };
    }
}
