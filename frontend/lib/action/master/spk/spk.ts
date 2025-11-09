import { SpkApiPayload } from "@/schemas/index";
import { SPK } from "@/types/spkReport";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getSpkByEmail(email: string) {
  try {
    const response = await fetch(
      `${API_URL}/api/spk/getSpkByEmail?email=${encodeURIComponent(email)}`,
      {
        credentials: "include", // ✅ INI HARUS DITAMBAHKAN
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Gagal mengambil data SPK");
    }

    return await response.json();
  } catch (err) {
    console.error("Gagal ambil SPK berdasarkan email:", err);
    throw err;
  }
}

export async function fetchAllSpk() {
  try {
    const res = await fetch(`${API_URL}/api/spk/getAllSPK`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Gagal fetch SPK");
    }

    return await res.json();
  } catch (error) {
    console.error("fetchAllSpk error:", error);
    throw error;
  }
}

export async function fetchAllSpkPr() {
  try {
    const res = await fetch(`${API_URL}/api/spk/getAllSPKPr`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Gagal fetch SPK");
    }

    return await res.json();
  } catch (error) {
    console.error("fetchAllSpk error:", error);
    throw error;
  }
}

export async function fetchSpkById(id: string) {
  try {
    console.log("🔍 Fetching SPK by ID:", id);
    
    const res = await fetch(`${API_URL}/api/spk/getSPKById/${id}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    console.log("📡 Response status:", res.status);

    if (!res.ok) {
      const errorData = await res.json();
      console.error("❌ API Error:", errorData);
      throw new Error(errorData.error || `Failed to fetch SPK: ${res.status}`);
    }

    const data = await res.json();
    
    // ✅ DEBUG: Log struktur data
    console.log("📊 Data structure from backend:", {
      type: typeof data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : 'N/A',
      data: data
    });

    // ✅ TEMPORARY FIX: Filter data di frontend
    if (Array.isArray(data)) {
      console.warn("⚠️ Backend mengembalikan SEMUA SPK, filtering by ID di frontend");
      
      // Cari SPK yang sesuai dengan ID
      const filteredSpk = data.find((spk: SPK) => spk.id === id);
      
      if (!filteredSpk) {
        console.error("❌ SPK dengan ID tidak ditemukan dalam array");
        throw new Error(`SPK dengan ID ${id} tidak ditemukan`);
      }
      
      console.log("✅ SPK ditemukan setelah filtering:", filteredSpk.spkNumber);
      return filteredSpk;
    }

    // Jika backend sudah mengembalikan single object
    console.log("✅ Backend mengembalikan single SPK:", data.spkNumber);
    return data;

  } catch (error) {
    console.error("❌ fetchSpkById error:", error);
    throw error;
  }
}

export async function fetchSpkByIdBap(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/spk/getReportsBySpkIdBap/${id}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Gagal fetch SPK by ID");
    }

    return await res.json();
  } catch (error) {
    console.error("fetchSpkById error:", error);
    throw error;
  }
}

export async function createSpk(data: SpkApiPayload) {
  try {
    const res = await fetch(`${API_URL}/api/spk/createSPK`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gagal membuat SPK: ${errorText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("createSpk error:", error);
    throw error;
  }
}

export async function updateSpk(id: string, data: SpkApiPayload) {
  try {
    const res = await fetch(`${API_URL}/api/spk/updateSPK${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Gagal update SPK");
    }

    return await res.json();
  } catch (error) {
    console.error("updateSpk error:", error);
    throw error;
  }
}

export async function deleteSpk(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/spk/deleteSPK/${id}`, {
      credentials: "include",
      method: "DELETE",
    });

    const responseData = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: responseData.message || "Gagal delete SPK",
      };
    }

    return {
      success: true,
      message: responseData.message || "SPK berhasil dihapus",
    };
  } catch (error) {
    console.error("deleteSpk error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus SPK",
    };
  }
}
