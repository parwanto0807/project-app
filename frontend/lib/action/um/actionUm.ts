import {
  CreateUangMukaInput,
  UpdateUangMukaInput,
  UpdateStatusInput,
  UangMukaQueryInput,
  UangMukaListResponse,
  UangMukaResponse,
  CairkanUangMukaData,
} from "@/types/typesUm";
interface SubmitDataWithFile {
  data: CreateUangMukaInput;
  file?: File;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// ========================
// API SERVICE FUNCTIONS
// ========================

/**
 * Helper function untuk handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Network error" }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
}

/**
 * Get all uang muka dengan pagination dan filtering
 */
export async function getAllUangMuka(
  filters: UangMukaQueryInput = {}
): Promise<UangMukaListResponse> {
  try {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (value instanceof Date) {
          queryParams.append(key, value.toISOString());
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/api/um/getAllUangMuka?${queryParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials:'include',
      }
    );

    return await handleResponse<UangMukaListResponse>(response);
  } catch (error) {
    console.error("Error getting all uang muka:", error);
    throw error;
  }
}

/**
 * Get uang muka by ID
 */
export async function getUangMukaById(id: string): Promise<UangMukaResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/um/getUangMukaById/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials:'include',
      }
    );

    return await handleResponse<UangMukaResponse>(response);
  } catch (error) {
    console.error("Error getting uang muka by id:", error);
    throw error;
  }
}

// actions/actionUm.ts
export async function createUangMuka(
  submitData: SubmitDataWithFile
): Promise<UangMukaResponse> {
  try {
    const { data, file } = submitData;

    // console.log("=== 🚨 DEBUG CREATE UANG MUKA ===");
    // console.log("📤 Data:", data);
    // console.log(
    //   "🔍 Jumlah (sebelum convert):",
    //   data.jumlah,
    //   "Tipe:",
    //   typeof data.jumlah
    // );

    // Buat FormData untuk kirim file + data
    const formData = new FormData();

    // Pastikan jumlah dikirim sebagai number
    formData.append("jumlah", data.jumlah.toString()); // Tetap string untuk FormData
    formData.append("metodePencairan", data.metodePencairan);

    if (data.keterangan) {
      formData.append("keterangan", data.keterangan);
    }
    if (data.namaBankTujuan) {
      formData.append("namaBankTujuan", data.namaBankTujuan);
    }
    if (data.nomorRekeningTujuan) {
      formData.append("nomorRekeningTujuan", data.nomorRekeningTujuan);
    }
    if (data.namaEwalletTujuan) {
      formData.append("namaEwalletTujuan", data.namaEwalletTujuan);
    }
    if (data.purchaseRequestId) {
      formData.append("purchaseRequestId", data.purchaseRequestId);
    }
    if (data.karyawanId) {
      formData.append("karyawanId", data.karyawanId);
    }
    if (data.spkId) {
      formData.append("spkId", data.spkId);
    }

    // Convert date to ISO string
    formData.append("tanggalPengajuan", data.tanggalPengajuan.toISOString());

    if (data.tanggalPencairan) {
      formData.append("tanggalPencairan", data.tanggalPencairan.toISOString());
    }
    if (data.buktiPencairanUrl) {
      formData.append("buktiPencairanUrl", data.buktiPencairanUrl);
    }

    // Append file jika ada
    if (file) {
      formData.append("buktiPencairan", file);
    }

    // console.log("📤 FormData entries:");
    // Array.from(formData.entries()).forEach(([key, value]) => {
    //   console.log(`  - ${key}:`, value);
    // });

    const response = await fetch(`${API_BASE_URL}/api/um/createUangMuka`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    // console.log("📨 Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error dari backend:", errorData);
      throw new Error(JSON.stringify(errorData)); // Kirim full error object
    }

    const result = await response.json();
    // console.log("✅ Success:", result);
    return result;
  } catch (error) {
    console.error("Error creating uang muka:", error);
    throw error;
  }
}

/**
 * Update uang muka
 */
export async function updateUangMuka(
  id: string,
  data: UpdateUangMukaInput
): Promise<UangMukaResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/updateUangMuka/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials:'include',
      body: JSON.stringify(data),
    });

    return await handleResponse<UangMukaResponse>(response);
  } catch (error) {
    console.error("Error updating uang muka:", error);
    throw error;
  }
}

/**
 * Update status uang muka dengan file upload
 */
// actionUm.ts
export async function updateUangMukaStatus(
  id: string,
  data: UpdateStatusInput
): Promise<UangMukaResponse> {
  try {
    const formData = new FormData();

    // Data dasar yang diperlukan
    formData.append("status", data.status);

    // Tanggal pencairan
    if (data.tanggalPencairan) {
      formData.append("tanggalPencairan", data.tanggalPencairan.toISOString());
    } else {
      formData.append("tanggalPencairan", new Date().toISOString());
    }

    // ✅ HANYA kirim buktiPencairan (file), JANGAN kirim buktiPencairanUrl
    if (data.buktiPencairan) {
      formData.append("buktiPencairan", data.buktiPencairan);
    } else {
      throw new Error("Bukti transaksi wajib diupload");
    }

    // ❌ JANGAN kirim buktiPencairanUrl - backend akan generate otomatis
    // if (data.buktiPencairanUrl) {
    //   formData.append("buktiPencairanUrl", data.buktiPencairanUrl);
    // }

    // Field metode pembayaran - WAJIB untuk DISBURSED
    if (data.metodePencairan) {
      formData.append("metodePencairan", data.metodePencairan as string);
    } else {
      throw new Error("Metode pencairan wajib diisi");
    }

    // Field tambahan opsional
    if (data.namaBankTujuan) {
      formData.append("namaBankTujuan", data.namaBankTujuan);
    }
    if (data.nomorRekeningTujuan) {
      formData.append("nomorRekeningTujuan", data.nomorRekeningTujuan);
    }
    if (data.namaEwalletTujuan) {
      formData.append("namaEwalletTujuan", data.namaEwalletTujuan);
    }

    console.log("📤 FormData entries:");
    Array.from(formData.entries()).forEach(([key, value]) => {
      console.log(`  - ${key}:`, value);
    });

    const url = `${API_BASE_URL}/api/um/updateUangMukaStatus/${id}`;
    console.log("🔗 Fetch URL:", url);

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    console.log("📨 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await handleResponse<UangMukaResponse>(response);
  } catch (error) {
    console.error("Error updating uang muka status:", error);
    throw error;
  }
}

/**
 * Delete uang muka
 */
export async function deleteUangMuka(id: string): Promise<UangMukaResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/um/deleteUangMuka/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials:'include',
      }
    );

    return await handleResponse<UangMukaResponse>(response);
  } catch (error) {
    console.error("Error deleting uang muka:", error);
    throw error;
  }
}

/**
 * Get uang muka by karyawan ID
 */
export async function getUangMukaByKaryawan(
  karyawanId: string,
  filters: Omit<UangMukaQueryInput, "karyawanId"> = {}
): Promise<UangMukaListResponse> {
  try {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (value instanceof Date) {
          queryParams.append(key, value.toISOString());
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/api/um/getUangMukaByKaryawan/${karyawanId}?${queryParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials:'include',
      }
    );

    return await handleResponse<UangMukaListResponse>(response);
  } catch (error) {
    console.error("Error getting uang muka by karyawan:", error);
    throw error;
  }
}

/**
 * Get uang muka statistics
 */
export async function getUangMukaStatistics(): Promise<{
  success: boolean;
  data?: {
    total: number;
    pending: number;
    disbursed: number;
    settled: number;
    rejected: number;
    totalAmount: number;
  };
  error?: string;
}> {
  try {
    // Jika backend punya endpoint statistics
    const response = await fetch(`${API_BASE_URL}/api/uang-muka/statistics`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials:'include',
    });

    if (response.ok) {
      return await handleResponse(response);
    } else {
      // Fallback: hitung manual dari data yang ada
      const allData = await getAllUangMuka({ limit: 1000 });

      if (allData.success && allData.data) {
        const statistics = {
          total: allData.pagination.total,
          pending: allData.data.filter((item) => item.status === "PENDING")
            .length,
          disbursed: allData.data.filter((item) => item.status === "DISBURSED")
            .length,
          settled: allData.data.filter((item) => item.status === "SETTLED")
            .length,
          rejected: allData.data.filter((item) => item.status === "REJECTED")
            .length,
          totalAmount: allData.data.reduce(
            (sum, item) => sum + Number(item.jumlah),
            0
          ),
        };

        return {
          success: true,
          data: statistics,
        };
      }

      throw new Error("Failed to get statistics");
    }
  } catch (error) {
    console.error("Error getting uang muka statistics:", error);
    return {
      success: false,
      error: "Gagal mengambil statistik uang muka",
    };
  }
}

/**
 * Download bukti pencairan
 */
export async function downloadBuktiPencairan(fileUrl: string): Promise<Blob> {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error("Failed to download file");
    }
    return await response.blob();
  } catch (error) {
    console.error("Error downloading bukti pencairan:", error);
    throw error;
  }
}

/**
 * Export uang muka to Excel/PDF
 */
/**
 * Export uang muka to Excel/PDF (Alternatif lebih type-safe)
 */
export async function exportUangMuka(
  filters: UangMukaQueryInput = {},
  format: "excel" | "pdf" = "excel"
): Promise<Blob> {
  try {
    // Build query parameters manually
    const params: Record<string, string> = { format };

    // Convert filters to string values
    if (filters.page) params.page = filters.page.toString();
    if (filters.limit) params.limit = filters.limit.toString();
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.karyawanId) params.karyawanId = filters.karyawanId;
    if (filters.spkId) params.spkId = filters.spkId;
    if (filters.startDate) params.startDate = filters.startDate.toISOString();
    if (filters.endDate) params.endDate = filters.endDate.toISOString();

    const queryParams = new URLSearchParams(params);

    const response = await fetch(
      `${API_BASE_URL}/uang-muka/export?${queryParams}`,
      {
        method: "GET",
        credentials:'include',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export failed: ${response.status} - ${errorText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Error exporting uang muka:", error);
    throw error;
  }
}

// actions/umActions.ts
export async function cairkanUangMuka(
  data: CairkanUangMukaData
): Promise<{ success: boolean; message: string }> {
  try {
    const formData = new FormData();

    formData.append("id", data.id);
    formData.append("tanggalPencairan", data.tanggalPencairan.toISOString());

    if (data.buktiTransaksi) {
      formData.append("buktiTransaksi", data.buktiTransaksi);
    }

    const response = await fetch(`${API_BASE_URL}/api/um/cairkan`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal mencairkan uang muka");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error cairkan uang muka:", error);
    throw error;
  }
}
