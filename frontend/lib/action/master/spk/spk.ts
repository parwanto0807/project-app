import { SpkApiPayload } from "@/schemas/index";
import { FetchSpkParams, SpkResponse } from "@/types/spk";
import { SPK } from "@/types/spkReport";
import { api } from "@/lib/http";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getSpkByEmail(email: string, includeClosed: boolean = false) {
  try {
    const url = new URL(`${API_URL}/api/spk/getSpkByEmail`);
    url.searchParams.set("email", email);
    if (includeClosed) {
      url.searchParams.set("includeClosed", "true");
    }

    const response = await fetch(
      url.toString(),
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
    if (typeof window !== "undefined") {
      const response = await api.get("/api/spk/getAllSPK");
      return response.data;
    }

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

// ✅ Versi ringan untuk halaman Monitoring Progress SPK (payload lebih kecil)
export async function fetchAllSpkReport() {
  try {
    const res = await fetch(`${API_URL}/api/spk/getAllSPKReport`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error || `Gagal fetch SPK report: ${res.status}`
      );
    }

    return await res.json();
  } catch (error) {
    console.error("fetchAllSpkReport error:", error);
    throw error;
  }
}

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

    ;((...args: any[]) => {})("Fetching from:", url);
    ;((...args: any[]) => {})("Filter parameters:", {
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

    ;((...args: any[]) => {})("Response status:", res.status);

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || `Gagal fetch SPK: ${res.status}`);
    }

    const result = await res.json();
    ;((...args: any[]) => {})("Received result:", {
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
    if (typeof window !== "undefined") {
      const response = await api.get("/api/spk/getAllSPKPr");
      return response.data;
    }

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
    console.error("fetchAllSpkPr error:", error);
    throw error;
  }
}

export async function fetchSpkById(id: string) {
  try {
    if (typeof window !== "undefined") {
      const response = await api.get(`/api/spk/getSPKById/${id}`);
      const data = response.data;
      if (Array.isArray(data)) {
        const filteredSpk = data.find((spk: SPK) => spk.id === id);
        if (!filteredSpk) {
          throw new Error(`SPK dengan ID ${id} tidak ditemukan`);
        }
        return filteredSpk;
      }
      return data;
    }

    const res = await fetch(`${API_URL}/api/spk/getSPKById/${id}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("❌ API Error:", errorData);
      throw new Error(errorData.error || `Failed to fetch SPK: ${res.status}`);
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      const filteredSpk = data.find((spk: SPK) => spk.id === id);

      if (!filteredSpk) {
        console.error("❌ SPK dengan ID tidak ditemukan dalam array");
        throw new Error(`SPK dengan ID ${id} tidak ditemukan`);
      }

      return filteredSpk;
    }

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

export async function updateSpkStatus(
  id: string,
  data: { spkStatus?: boolean; spkStatusClose?: boolean }
) {
  try {
    const res = await fetch(`${API_URL}/api/spk/updateSPKStatus/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Gagal update status SPK");
    }

    return await res.json();
  } catch (error) {
    console.error("updateSpkStatus error:", error);
    throw error;
  }
}

// ✅ Add function to update Sales Order status to mark as READ
export async function updateSalesOrderStatus(
  id: string,
  status: string
) {
  try {
    const res = await fetch(`${API_URL}/api/salesOrder/update/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Gagal update status SO");
    }

    return await res.json();
  } catch (error) {
    console.error("updateSalesOrderStatus error:", error);
    throw error;
  }
}
