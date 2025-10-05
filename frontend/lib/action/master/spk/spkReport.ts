// lib/action/master/spk/spkReport.ts
import { SpkFieldReport, SpkFieldReportPhoto, ReportHistory } from "@/types/spkReport";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Helper function untuk handle response
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
};

// 💡 Membuat laporan lapangan baru
export const createSpkFieldReport = async (
  formData: FormData
): Promise<{ success: boolean; data: SpkFieldReport; message: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/spk/report/createSpkFieldReport`,
      {
        method: "POST",
        body: formData, // FormData sudah termasuk file dan fields
      }
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Error creating SPK field report:", error);
    throw error;
  }
};

// 💡 Tambah foto ke laporan yang sudah ada
export const addPhotosToReport = async (
  reportId: string,
  formData: FormData
): Promise<{
  success: boolean;
  data: SpkFieldReportPhoto[];
  message: string;
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/spk/report/addPhotosToReport/${reportId}/photos`,
      {
        method: "POST",
        body: formData,
      }
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Error adding photos to report:", error);
    throw error;
  }
};

// 💡 Helper function untuk membuat FormData dari data laporan
export const createReportFormData = ({
  spkId,
  karyawanId,
  type,
  progress,
  note,
  photos,
  soDetailId,
}: {
  spkId: string;
  karyawanId: string | "";
  type: "PROGRESS" | "FINAL";
  progress: number;
  note?: string;
  photos?: File[] ;
  soDetailId?: string; // 👈 boleh null/undefined
}): FormData => {
  const formData = new FormData();

  // ✅ Wajib: spkId
  formData.append("spkId", spkId);

  // ✅ Wajib: karyawanId (bisa "" jika tidak tersedia)
  formData.append("karyawanId", karyawanId);

  // ✅ Wajib: type
  formData.append("type", type);
  formData.append("progress", String(progress));

  // ✅ Opsional: note — hanya jika ada dan bukan kosong
  if (note && note.trim() !== "") {
    formData.append("note", note.trim());
  }

  // ✅ Opsional: photos — hanya jika ada
  if (photos && photos.length > 0) {
    photos.forEach((photo, index) => {
      formData.append("photos", photo);
      console.log(
        `🖼️ Ditambahkan foto ${index + 1}:`,
        photo.name,
        `(${photo.size} bytes)`
      );
    });
  } else {
    console.warn("⚠️ Tidak ada foto yang ditambahkan ke FormData");
  }

  // ✅ ✅ ✅ KRITIS: soDetailId — hanya append jika bernilai valid (bukan null/undefined/kosong)
  if (soDetailId && soDetailId.trim() !== "") {
    formData.append("soDetailId", soDetailId.trim());
    // console.log("📌 Ditambahkan soDetailId:", soDetailId.trim());
  } else {
    console.log("➖ Tidak menambahkan soDetailId (tidak dipilih atau kosong)");
  }

  // 👇 Debug akhir
  // console.log("📤 Isi FormData akhir:", [...formData.entries()]);

  return formData;
};

// 💡 Helper function untuk membuat FormData hanya photos
export const createPhotosFormData = (
  photos: File[],
  karyawanId: string
): FormData => {
  const formData = new FormData();

  // Tambahkan karyawanId (diperlukan oleh backend)
  formData.append("karyawanId", karyawanId);

  // Tambahkan files
  photos.forEach((photo) => {
    formData.append("photos", photo);
  });

  return formData;
};

// 💡 Mendapatkan semua laporan berdasarkan SPK ID
export const getReportsBySpkId = async (
  spkId: string
): Promise<{ success: boolean; data: SpkFieldReport[] }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/spk/report/getReportsBySpkId/${spkId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching reports by SPK ID:", error);
    throw error;
  }
};

// 💡 Mendapatkan satu laporan berdasarkan ID
export const getReportById = async (
  reportId: string
): Promise<{ success: boolean; data: SpkFieldReport }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/spk/report/getReportById/${reportId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching report by ID:", error);
    throw error;
  }
};

// 💡 Update status laporan (approve/reject)
export const updateReportStatus = async (
  reportId: string,
  status: "APPROVED" | "REJECTED" | "PENDING"
): Promise<{ success: boolean; data: SpkFieldReport; message: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/spk/report/updateReportStatus/${reportId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Error updating report status:", error);
    throw error;
  }
};

// 💡 Hapus laporan
export const deleteReport = async (
  reportId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/spk/report/deleteReport/${reportId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return await handleResponse(response);
  } catch (error) {
    console.error("Error deleting report:", error);
    throw error;
  }
};

// Pastikan interface ini ada

export interface FetchReportsFilters {
  date?: 'all' | 'today' | 'thisWeek' | 'thisMonth';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'all';
  spkId?: string;
  karyawanId?: string;
}

/**
 * Mengambil daftar laporan SPK dari backend
 * @param filters - Filter pencarian
 * @returns Promise<ReportHistory[]>
 */
export async function fetchSPKReports(filters: FetchReportsFilters = {}): Promise<ReportHistory[]> {
  const params = new URLSearchParams();

  if (filters.date && filters.date !== 'all') params.append('date', filters.date);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.spkId) params.append('spkId', filters.spkId);
  if (filters.karyawanId) params.append('karyawanId', filters.karyawanId);

  const url = `${API_BASE_URL}/api/spk/report/getSPKFieldReports?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include', // Kirim cookie/session
    cache: 'no-store',     // Jangan cache, karena data real-time
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: Gagal mengambil laporan`);
  }

  return res.json();
}
