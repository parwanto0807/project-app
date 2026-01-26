"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getAssets(query: string = "") {
    try {
        const res = await fetch(`${API_URL}/api/assets${query}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal mengambil data aset");
        return await res.json();
    } catch (error) {
        console.error("getAssets error:", error);
        throw error;
    }
}

export async function getAssetById(id: string) {
    try {
        const res = await fetch(`${API_URL}/api/assets/${id}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal mengambil detail aset");
        return await res.json();
    } catch (error) {
        throw error;
    }
}

export async function createAsset(data: any) {
    try {
        const res = await fetch(`${API_URL}/api/assets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include",
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Gagal membuat aset");
        }
        return await res.json();
    } catch (error) {
        throw error;
    }
}

export async function updateAsset(id: string, data: any) {
    try {
        const res = await fetch(`${API_URL}/api/assets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include",
        });
        if (!res.ok) throw new Error("Gagal memperbarui aset");
        return await res.json();
    } catch (error) {
        throw error;
    }
}

export async function deleteAsset(id: string) {
    try {
        const res = await fetch(`${API_URL}/api/assets/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) throw new Error("Gagal menghapus aset");
        return await res.json();
    } catch (error) {
        throw error;
    }
}

// Category Actions
export async function getAssetCategories() {
    try {
        const res = await fetch(`${API_URL}/api/assets/categories`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal mengambil kategori aset");
        return await res.json();
    } catch (error) {
        throw error;
    }
}

export async function createAssetCategory(data: any) {
    try {
        const res = await fetch(`${API_URL}/api/assets/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include",
        });
        if (!res.ok) throw new Error("Gagal membuat kategori aset");
        return await res.json();
    } catch (error) {
        throw error;
    }
}

// Action Actions
export async function postDepreciation(id: string, periodId: string, date: string) {
    try {
        const res = await fetch(`${API_URL}/api/assets/${id}/depreciate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ periodId, date }),
            credentials: "include",
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Gagal memproses penyusutan");
        }
        return await res.json();
    } catch (error) {
        throw error;
    }
}

export async function disposeAsset(id: string, data: any) {
    try {
        const res = await fetch(`${API_URL}/api/assets/${id}/dispose`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include",
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Gagal memproses pelepasan aset");
        }
        return await res.json();
    } catch (error) {
        throw error;
    }
}

export async function bulkCreateAssets(assets: any[]) {
    try {
        const res = await fetch(`${API_URL}/api/assets/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assets }),
            credentials: "include",
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Gagal mengunggah aset");
        }
        return await res.json();
    } catch (error) {
        throw error;
    }
}

export async function getMaintenances(assetId: string) {
    try {
        const res = await fetch(`${API_URL}/api/assets/maintenance/asset/${assetId}`, {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) throw new Error("Gagal mengambil data pemeliharaan");
        return await res.json();
    } catch (error) {
        throw error;
    }
}

export async function createMaintenance(data: any) {
    try {
        const res = await fetch(`${API_URL}/api/assets/maintenance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include",
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Gagal mencatat pemeliharaan");
        }
        return await res.json();
    } catch (error) {
        throw error;
    }
}
