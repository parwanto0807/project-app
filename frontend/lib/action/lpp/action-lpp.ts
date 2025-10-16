"use server";

import {
  createLppSchema,
  updateLppSchema,
  lppIdSchema,
  // updateDetailSchema,
  detailIdSchema,
  fotoIdSchema,
  updateStatusSchema,
  lppQuerySchema,
  uploadFotoSchema,
  LppItemSchema,
} from "@/schemas/lpp/schemas-lpp";
import {
  UpdateLppForm,
  Detail,
  // UpdateDetail,
  LppId,
  // DetailId,
  FotoId,
  UpdateStatus,
  LppQueryParams,
  UploadFotoForm,
  CreateLppForm,
} from "@/types/types-lpp";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Helper fetch
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "API Error");
  }
  return res.json() as Promise<T>;
}

// Extended type untuk include file info
export type CreateLppFormWithFiles = CreateLppForm & {
  fotoBukti?: { rincianIndex: number; files: File[] }[];
};

// Function createLpp
export async function createLpp(data: CreateLppFormWithFiles) {
  const { fotoBukti, ...lppData } = data;

  // ✅ Validasi data utama
  console.log(
    "📦 Raw LPP Data (before parse):",
    JSON.stringify(lppData, null, 2)
  );
  const parsed = createLppSchema.parse(lppData);

  // Buat FormData untuk file upload
  const formData = new FormData();
  formData.append("data", JSON.stringify(parsed));

  // ✅ Sesuaikan dengan backend (field name harus "fotoBukti")
  if (fotoBukti && fotoBukti.length > 0) {
    fotoBukti.forEach((foto) => {
      foto.files.forEach((file) => {
        formData.append("fotoBukti", file); // 👈 langsung pakai "fotoBukti"
      });
    });
  }

  console.log("📤 Mengirim LPP:", parsed);
  console.log(
    "📎 File count:",
    fotoBukti?.reduce((acc, f) => acc + f.files.length, 0) || 0
  );

  const res = await fetch(`${API_BASE_URL}/api/lpp/createLpp`, {
    method: "POST",
    body: formData, // browser otomatis set Content-Type multipart/form-data
  });

  return handleResponse(res);
}

// ✅ Get All LPP
export async function getAllLpp(params?: LppQueryParams) {
  // validasi pakai zod schema
  const parsed = lppQuerySchema.parse(params || {});

  // pastikan semua value jadi string
  const query = new URLSearchParams(
    Object.entries(parsed).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      },
      {}
    )
  ).toString();

  const res = await fetch(`${API_BASE_URL}/api/lpp?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  return handleResponse(res);
}

// ✅ Get LPP by ID
export async function getLppById(data: LppId) {
  const parsed = lppIdSchema.parse(data);

  const res = await fetch(`${API_BASE_URL}/api/lpp/${parsed.id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  return handleResponse(res);
}

// ✅ Update LPP
export async function updateLpp(id: string, data: UpdateLppForm) {
  const parsedId = lppIdSchema.parse({ id });
  const parsed = updateLppSchema.parse(data);

  const res = await fetch(`${API_BASE_URL}/api/lpp/${parsedId.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed),
  });

  return handleResponse(res);
}

// ✅ Delete LPP
export async function deleteLpp(data: LppId) {
  const parsed = lppIdSchema.parse(data);

  const res = await fetch(`${API_BASE_URL}/api/lpp/${parsed.id}`, {
    method: "DELETE",
  });

  return handleResponse(res);
}

// ✅ Add Detail
export async function addDetail(lppId: string, detail: Detail) {
  const parsedId = lppIdSchema.parse({ id: lppId });
  const parsedDetail = LppItemSchema.parse(detail);

  const res = await fetch(`${API_BASE_URL}/api/lpp/${parsedId.id}/details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsedDetail),
  });

  return handleResponse(res);
}

// ✅ Update Detail
// export async function updateDetail(data: DetailId, detail: UpdateDetail) {
//   const parsed = detailIdSchema.parse(data);
//   const parsedDetail = updateDetailSchema.parse(detail);

//   const res = await fetch(
//     `${API_BASE_URL}/api/lpp/${parsed.id}/details/${parsed.detailId}`,
//     {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(parsedDetail),
//     }
//   );

//   return handleResponse(res);
// }

// // ✅ Delete Detail
// export async function deleteDetail(data: DetailId) {
//   const parsed = detailIdSchema.parse(data);

//   const res = await fetch(
//     `${API_BASE_URL}/api/lpp/${parsed.id}/details/${parsed.detailId}`,
//     {
//       method: "DELETE",
//     }
//   );

//   return handleResponse(res);
// }

// ✅ Update Status
export async function updateStatus(id: string, statusData: UpdateStatus) {
  const parsedId = lppIdSchema.parse({ id });
  const parsedStatus = updateStatusSchema.parse(statusData);

  const res = await fetch(`${API_BASE_URL}/api/lpp/${parsedId.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsedStatus),
  });

  return handleResponse(res);
}

// ✅ Upload Foto (form-data)
// Di lib/action/lpp/action-lpp.ts - perbaiki uploadFoto function
export async function uploadFoto(
  detailId: string,
  file: File,
  data: UploadFotoForm,
  lppId: string
) {
  try {
    // Validasi manual sebelum Zod
    if (!detailId) {
      throw new Error("detailId is undefined or null");
    }

    if (typeof detailId !== "string") {
      throw new Error(`detailId is not a string: ${typeof detailId}`);
    }

    if (detailId.trim() === "") {
      throw new Error("detailId is empty string");
    }

    // Bersihkan ID dari spasi
    const cleanDetailId = detailId.trim();

    // Validasi dengan Zod
    const parsedId = detailIdSchema.parse({ id: cleanDetailId });
    const parsed = uploadFotoSchema.parse(data);

    const formData = new FormData();
    formData.append("fotoBukti", file);
    if (parsed.keterangan) formData.append("keterangan", parsed.keterangan);
    const res = await fetch(
      `${API_BASE_URL}/api/lpp/${lppId}/details/${parsedId.id}/upload-foto`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Upload failed: ${res.status} - ${errorText}`);
    }

    const result = await res.json();

    return result;
  } catch (error) {
    console.error("❌ Error in uploadFoto:", error);
    throw error;
  }
}

// ✅ Delete Foto
export async function deleteFoto(data: FotoId) {
  const parsed = fotoIdSchema.parse(data);

  const res = await fetch(`${API_BASE_URL}/api/lpp/foto/${parsed.fotoId}`, {
    method: "DELETE",
  });

  return handleResponse(res);
}
