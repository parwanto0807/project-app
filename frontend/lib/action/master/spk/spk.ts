import { SpkApiPayload } from "@/schemas/index";
import { FetchSpkParams, SpkResponse } from "@/types/spk";
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

// @/lib/action/master/spk/spk.ts

export async function fetchAllSpkAdmin(
  params?: FetchSpkParams
): Promise<SpkResponse> {
  try {
    const {
      page = 1,
      pageSize = 10,
      searchTerm = "",
      statusFilter = "",
      filterBy = "",
      team = "",
      status = "",
    } = params || {};

    // ===== Build Query Params =====
    const queryParams = new URLSearchParams();
    queryParams.append("page", String(page));
    queryParams.append("pageSize", String(pageSize));
    if (searchTerm) queryParams.append("search", searchTerm);
    if (statusFilter) queryParams.append("status", statusFilter);
    if (filterBy) queryParams.append("filterBy", filterBy);
    if (team) queryParams.append("team", team);
    if (status) queryParams.append("status", status);

    // ===== Gunakan endpoint baru =====
    const url = `${API_URL}/api/spk/getAllSPKAdmin?${queryParams.toString()}`;

    ;(() => {})("Fetching from:", url);
    ;(() => {})("Filter parameters:", {
      page,
      pageSize,
      searchTerm,
      statusFilter,
      filterBy,
    });

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    ;(() => {})("Response status:", res.status);

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || `Gagal fetch SPK: ${res.status}`);
    }

    const result = await res.json();
    ;(() => {})("Received result:", {
      dataCount: result.data?.length || 0,
      pagination: result.pagination,
      filterApplied: filterBy,
    });

    return result;
  } catch (error) {
    console.error("fetchAllSpkAdmin error:", error);
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
    // ;(() => {})("🔍 Fetching SPK by ID:", id);

    const res = await fetch(`${API_URL}/api/spk/getSPKById/${id}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    // ;(() => {})("📡 Response status:", res.status);

    if (!res.ok) {
      const errorData = await res.json();
      console.error("❌ API Error:", errorData);
      throw new Error(errorData.error || `Failed to fetch SPK: ${res.status}`);
    }

    const data = await res.json();

    // ✅ DEBUG: Log struktur data
    // ;(() => {})("📊 Data structure from backend:", {
    //   type: typeof data,
    //   isArray: Array.isArray(data),
    //   length: Array.isArray(data) ? data.length : "N/A",
    //   data: data,
    // });

    // ✅ TEMPORARY FIX: Filter data di frontend
    if (Array.isArray(data)) {
      // console.warn(
      //   "⚠️ Backend mengembalikan SEMUA SPK, filtering by ID di frontend"
      // );

      // Cari SPK yang sesuai dengan ID
      const filteredSpk = data.find((spk: SPK) => spk.id === id);

      if (!filteredSpk) {
        console.error("❌ SPK dengan ID tidak ditemukan dalam array");
        throw new Error(`SPK dengan ID ${id} tidak ditemukan`);
      }

      // ;(() => {})("✅ SPK ditemukan setelah filtering:", filteredSpk.spkNumber);
      return filteredSpk;
    }

    // Jika backend sudah mengembalikan single object
    // ;(() => {})("✅ Backend mengembalikan single SPK:", data.spkNumber);
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

export async function updateSpkProgressComment(
  id: string,
  data: { progress?: number; progressComment?: string; userId?: string }
) {
  try {
    const res = await fetch(`${API_URL}/api/spk/updateSPKProgressComment/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Gagal update monitoring progress");
    }

    return await res.json();
  } catch (error) {
    console.error("updateSpkProgressComment error:", error);
    throw error;
  }
}

export async function getSpkProgressLogs(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/spk/getSPKProgressLogs/${id}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Gagal fetch riwayat progress");
    }

    return await res.json();
  } catch (error) {
    console.error("getSpkProgressLogs error:", error);
    throw error;
  }
}
