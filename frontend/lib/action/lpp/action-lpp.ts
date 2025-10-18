"use server";

import {
  createLppSchema,
  lppIdSchema,
  detailIdSchema,
  fotoIdSchema,
  updateStatusSchema,
  lppQuerySchema,
  LppItemSchema,
  updateDetailSchema,
} from "@/schemas/lpp/schemas-lpp";

import {
  Detail,
  LppId,
  UpdateStatus,
  LppQueryParams,
  UploadFotoForm,
  CreateLppForm,
  UpdateLppForm,
  UpdateDetail,
} from "@/types/types-lpp";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// === Helper ===
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

// === CREATE ===
export async function createLpp(data: CreateLppFormWithFiles) {
  const { fotoBukti, ...lppData } = data;
  const parsed = createLppSchema.parse(lppData);

  const formData = new FormData();
  formData.append("data", JSON.stringify(parsed));

  if (fotoBukti && fotoBukti.length > 0) {
    fotoBukti.forEach((foto) => {
      foto.files.forEach((file) => {
        formData.append("fotoBukti", file);
      });
    });
  }

  const res = await fetch(`${API_BASE_URL}/api/lpp/createLpp`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(res);
}

// === GET ALL ===
export async function getAllLpp(params?: LppQueryParams) {
  const parsed = lppQuerySchema.parse(params || {});
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

  const res = await fetch(`${API_BASE_URL}/api/lpp/getAllLpp?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  return handleResponse(res);
}

// === GET BY ID ===
export async function getLppById(data: LppId) {
  const parsed = lppIdSchema.parse(data);
  const res = await fetch(`${API_BASE_URL}/api/lpp/getLppById/${parsed.id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return handleResponse(res);
}

// === UPDATE HEADER ===
export async function updateLpp(lppId: string, data: UpdateLppForm) {
  const response = await fetch(`${API_BASE_URL}/api/lpp/updateLpp/${lppId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Gagal memperbarui LPP");
  }
  return response.json();
}

// === DELETE HEADER ===
export async function deleteLpp(data: LppId) {
  const parsed = lppIdSchema.parse(data);
  const res = await fetch(`${API_BASE_URL}/api/lpp/deleteLpp/${parsed.id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// === DETAIL OPERATIONS ===
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

export async function updateDetail(detailId: string, detail: UpdateDetail) {
  const parsed = detailIdSchema.parse({ detailId });
  const parsedDetail = updateDetailSchema.parse(detail);

  const res = await fetch(
    `${API_BASE_URL}/api/lpp/details/${parsed.detailId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedDetail),
    }
  );
  return handleResponse(res);
}

export async function deleteDetail(detailId: string) {
  const parsed = detailIdSchema.parse({ detailId });
  const res = await fetch(
    `${API_BASE_URL}/api/lpp/details/${parsed.detailId}`,
    {
      method: "DELETE",
    }
  );
  return handleResponse(res);
}

// Batch update detail
export async function batchUpdateDetails(lppId: string, details: Detail[]) {
  const parsedId = lppIdSchema.parse({ id: lppId });
  const res = await fetch(
    `${API_BASE_URL}/api/lpp/${parsedId.id}/details/batch`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    }
  );
  return handleResponse(res);
}

// === STATUS ===
export async function updateStatus(id: string, statusData: UpdateStatus) {
  const parsedId = lppIdSchema.parse({ id });
  const parsedStatus = updateStatusSchema.parse(statusData);

  const res = await fetch(
    `${API_BASE_URL}/api/lpp/updateStatus/${parsedId.id}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedStatus),
    }
  );
  return handleResponse(res);
}

// === FOTO OPERATIONS ===
export async function uploadFoto(
  detailId: string,
  file: File,
  data: UploadFotoForm,
  lppId: string
): Promise<{ url: string }> {
  // Pastikan return type sesuai
  try {
    console.log("🔍 [UPLOAD] Starting upload...", {
      detailId: detailId?.substring(0, 8) + "...",
      lppId: lppId?.substring(0, 8) + "...",
      fileName: file.name,
      fileSize: file.size,
      keterangan: data.keterangan,
    });

    // Validasi detailId
    if (!detailId || detailId.trim() === "") {
      throw new Error(`Invalid detailId: ${detailId}`);
    }

    const cleanDetailId = detailId.trim();
    const cleanLppId = lppId.trim();

    const formData = new FormData();
    formData.append("fotoBukti", file);
    if (data.keterangan) {
      formData.append("keterangan", data.keterangan);
    }

    const url = `${API_BASE_URL}/api/lpp/${cleanLppId}/details/${cleanDetailId}/upload-foto`;
    console.log("🌐 Calling API:", url);

    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        const errorText = await res.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`Upload failed: ${errorMessage}`);
    }

    const result = await res.json();
    console.log("✅ Upload successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Upload error details:", {
      error,
      detailId: detailId?.substring(0, 8) + "...",
      lppId: lppId?.substring(0, 8) + "...",
      fileName: file?.name,
    });
    throw error;
  }
}

export async function deleteFoto(fotoId: string) {
  const parsed = fotoIdSchema.parse({ fotoId });
  const res = await fetch(
    `${API_BASE_URL}/api/lpp/foto-bukti/${parsed.fotoId}`,
    {
      method: "DELETE",
    }
  );
  return handleResponse(res);
}

export async function updateFotoKeterangan(fotoId: string, keterangan: string) {
  const parsed = fotoIdSchema.parse({ fotoId });
  const res = await fetch(
    `${API_BASE_URL}/api/lpp/foto-bukti/${parsed.fotoId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keterangan }),
    }
  );
  return handleResponse(res);
}

// === ADVANCED ===
export async function duplicateLpp(lppId: string) {
  const parsed = lppIdSchema.parse({ id: lppId });
  const res = await fetch(`${API_BASE_URL}/api/lpp/${parsed.id}/duplicate`, {
    method: "POST",
  });
  return handleResponse(res);
}

export async function exportLppToPdf(lppId: string) {
  const parsed = lppIdSchema.parse({ id: lppId });
  const res = await fetch(`${API_BASE_URL}/api/lpp/${parsed.id}/export/pdf`, {
    method: "GET",
  });
  return res.blob();
}

export async function exportLppToExcel(lppId: string) {
  const parsed = lppIdSchema.parse({ id: lppId });
  const res = await fetch(`${API_BASE_URL}/api/lpp/${parsed.id}/export/excel`, {
    method: "GET",
  });
  return res.blob();
}
