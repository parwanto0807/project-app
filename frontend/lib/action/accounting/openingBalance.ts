"use client";

import { OpeningBalance, CreateOpeningBalanceInput } from "@/types/openingBalance";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getOpeningBalances(query: string = ""): Promise<{ data: OpeningBalance[], pagination: any }> {
    try {
        const res = await fetch(`${API_URL}/api/accounting/opening-balance/getAll${query}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal mengambil data saldo awal");
        return await res.json();
    } catch (error) {
        console.error("getOpeningBalances error:", error);
        throw error;
    }
}

export async function getOpeningBalanceById(id: string): Promise<OpeningBalance> {
    try {
        const res = await fetch(`${API_URL}/api/accounting/opening-balance/getById/${id}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal mengambil detail saldo awal");
        const json = await res.json();
        return json.data;
    } catch (error) {
        console.error("getOpeningBalanceById error:", error);
        throw error;
    }
}

export async function createOpeningBalance(data: CreateOpeningBalanceInput) {
    try {
        const res = await fetch(`${API_URL}/api/accounting/opening-balance/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include",
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Gagal membuat saldo awal");
        }
        return await res.json();
    } catch (error) {
        console.error("createOpeningBalance error:", error);
        throw error;
    }
}

export async function updateOpeningBalance(id: string, data: Partial<CreateOpeningBalanceInput>) {
    try {
        const res = await fetch(`${API_URL}/api/accounting/opening-balance/update/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include",
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Gagal update saldo awal");
        }
        return await res.json();
    } catch (error) {
        console.error("updateOpeningBalance error:", error);
        throw error;
    }
}

export async function postOpeningBalance(id: string) {
    try {
        const res = await fetch(`${API_URL}/api/accounting/opening-balance/post/${id}`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Gagal memposting saldo awal");
        }
        return await res.json();
    } catch (error) {
        console.error("postOpeningBalance error:", error);
        throw error;
    }
}

export async function deleteOpeningBalance(id: string) {
    try {
        const res = await fetch(`${API_URL}/api/accounting/opening-balance/delete/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Gagal menghapus saldo awal");
        }
        return await res.json();
    } catch (error) {
        console.error("deleteOpeningBalance error:", error);
        throw error;
    }
}
