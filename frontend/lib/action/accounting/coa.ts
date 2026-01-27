"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getCoaByType(type: string, postingType: string = "POSTING", limit: number = 100) {
    try {
        const res = await fetch(`${API_URL}/api/coa/getAllCOA?type=${type}&postingType=${postingType}&limit=${limit}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal mengambil data akun");
        return await res.json();
    } catch (error) {
        console.error("getCoaByType error:", error);
        throw error;
    }
}
