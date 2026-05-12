import { OperationalExpense } from "@/types/finance/operationalExpense";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api$/, "");

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
            errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
    }
    return response.json();
}

export const opexApi = {
    async create(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            // Calling API directly from client to bypass Next.js Server Action limits
            const response = await fetch(`${API_BASE}/api/finance/operational-expenses`, {
                method: "POST",
                body: formData,
                // Browser automatically includes cookies if credentials is set
                // or if it's same-origin. For cross-origin, we need credentials: "include"
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
            const response = await fetch(`${API_BASE}/api/finance/operational-expenses/${id}`, {
                method: "PUT",
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
