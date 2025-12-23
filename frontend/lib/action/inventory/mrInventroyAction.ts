import { ApiResponse, ListResponse, PaginationMeta } from "@/types/api";

// Sesuaikan dengan URL Backend Anda (biasanya ditaruh di .env)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface GetMrParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
}

export interface IssueMrParams {
    qrToken: string;
    issuedById: string;
}

/**
 * Mengambil data MR dari API Backend Express
 */
export async function getDataMr(
    params: GetMrParams
): Promise<ApiResponse<ListResponse<any>>> {
    try {
        // 1. Mengubah object params menjadi Query String (misal: ?page=1&pageSize=10)
        const queryString = new URLSearchParams({
            page: (params.page || 1).toString(),
            pageSize: (params.pageSize || 10).toString(),
            ...(params.search && { search: params.search }),
            ...(params.status && { status: params.status }),
        }).toString();

        // 2. Memanggil API Backend
        const response = await fetch(`${API_URL}/api/mr?${queryString}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                // Jika ada token auth, tambahkan di sini:
                // "Authorization": `Bearer ${token}`
            },
            next: { revalidate: 0 } // Jika menggunakan Next.js agar tidak caching
        });

        const result = await response.json();

        // 3. Mengembalikan data sesuai interface ApiResponse
        if (!response.ok) {
            return {
                success: false,
                error: result.error || "Gagal mengambil data dari server",
                details: result.details
            };
        }

        return result; // Backend sudah mengirim format { success, data: { data, pagination } }

    } catch (error: any) {
        console.error("Fetch Error:", error);
        return {
            success: false,
            error: "Koneksi ke server terputus",
            details: error.message
        };
    }
}

/**
 * Issue MR - Scan QR Code dan keluarkan barang dari gudang
 */
export async function issueMR(
    params: IssueMrParams
): Promise<ApiResponse<any>> {
    console.log("issueMR called with params:", params)
    console.log("API URL:", `${API_URL}/api/mr/issue-scan`)

    try {
        const response = await fetch(`${API_URL}/api/mr/issue-scan`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params)
        });

        console.log("Response status:", response.status)
        console.log("Response ok:", response.ok)

        const result = await response.json();
        console.log("Response body:", result)

        if (!response.ok) {
            return {
                success: false,
                error: result.error || "Gagal mengeluarkan material",
                details: result.details
            };
        }

        return result;

    } catch (error: any) {
        console.error("Issue MR Error:", error);
        return {
            success: false,
            error: "Koneksi ke server terputus",
            details: error.message
        };
    }
}