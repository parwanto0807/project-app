"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Get Goods Receipts with optional filtering
 */
export async function getGoodsReceipts(query: { purchaseOrderId?: string; page?: number; limit?: number }) {
    try {
        const params = new URLSearchParams();
        if (query.purchaseOrderId) params.append("purchaseOrderId", query.purchaseOrderId);
        if (query.page) params.append("page", query.page.toString());
        if (query.limit) params.append("limit", query.limit.toString());

        const response = await fetch(`${API_URL}/api/gr?${params.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch goods receipts: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching goods receipts:", error);
        throw error;
    }
}
