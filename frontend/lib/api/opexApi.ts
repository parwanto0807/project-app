import { OperationalExpense } from "@/types/finance/operationalExpense";

const getApiBase = () => {
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "rylif-app.com" || hostname.endsWith(".rylif-app.com")) {
            return "https://api.rylif-app.com";
        }
    }
    const envApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return envApi.replace(/\/api$/, "");
};

const API_BASE = getApiBase();

// Helper to get cookie value by name on client side
const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
};

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `Server error (${response.status}): ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            console.error(`[API Error ${response.status}]`, errorData);
        } catch {
            console.error(`[API Error ${response.status}] Could not parse JSON response`);
            if (response.status === 413) errorMessage = "File terlalu besar (Limit Server)";
            if (response.status === 403) errorMessage = "Akses ditolak (403 Forbidden) - Sesi mungkin habis, silakan login ulang";
            if (response.status === 401) errorMessage = "Sesi tidak valid atau habis - Silakan login ulang";
            if (response.status === 404) errorMessage = "Endpoint API tidak ditemukan (404 Not Found)";
        }
        throw new Error(errorMessage);
    }
    return response.json();
}

export const opexApi = {
    async create(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const token = getCookie("accessTokenReadable") || getCookie("accessToken");
            const headers: any = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE}/api/finance/operational-expenses`, {
                method: "POST",
                headers,
                body: formData,
                credentials: "include", 
            });

            const data = await handleResponse<any>(response);
            return { success: true, data };
        } catch (error: any) {
            console.error("Opex API Create Error:", error);
            return { success: false, error: error.message || "Gagal membuat data" };
        }
    },

    async update(id: string, formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const token = getCookie("accessTokenReadable") || getCookie("accessToken");
            const headers: any = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE}/api/finance/operational-expenses/${id}`, {
                method: "PUT",
                headers,
                body: formData,
                credentials: "include",
            });

            const data = await handleResponse<any>(response);
            return { success: true, data };
        } catch (error: any) {
            console.error("Opex API Update Error:", error);
            return { success: false, error: error.message || "Gagal mengupdate data" };
        }
    }
};

