"use server";

import { z } from "zod";
import {
  BAPSchema,
  BAPCreateSchema,
  BAPUpdateSchema,
  BAPPhotoSchema,
  BAPStatusEnum,
  BAPPhotoInput,
} from "@/schemas/bap";
import { cookies } from "next/headers";
import { BAPData } from "@/app/(protected)/admin-area/logistic/bap/page";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type APIResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Type definitions
export type BAP = z.infer<typeof BAPSchema>;
export type BAPCreateInput = z.infer<typeof BAPCreateSchema>;
export type BAPUpdateInput = z.infer<typeof BAPUpdateSchema>;
export type BAPPhoto = z.infer<typeof BAPPhotoSchema>;

// Helper function for API calls
const fetchAPI = async (url: string, options: RequestInit = {}) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value || null;

  const isFormData = options.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const defaultOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: defaultHeaders,
    cache: "no-store",
  };

  const response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.message ||
      errorData?.error ||
      `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
};

// Get all BAPs with pagination and filters
export const getAllBAP = async (params?: {
  page?: number;
  limit?: number;
  status?: z.infer<typeof BAPStatusEnum>;
  search?: string;
  filterBy?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.filterBy) queryParams.append("filterBy", params.filterBy);

    const url = `/api/bap/getAllBAP?${queryParams.toString()}`;

    // Definisikan interface untuk response
    interface BAPResponse {
      data: BAPData[];
      pagination: {
        page?: number;
        limit?: number;
        total?: number;
        pages?: number;
      };
    }

    const res = (await fetchAPI(url)) as BAPResponse;

    // Mapping struktur pagination dari API ke struktur yang diharapkan page.tsx
    const apiPagination = res.pagination;
    const mappedPagination = {
      currentPage: apiPagination?.page || params?.page || 1,
      pageSize: apiPagination?.limit || params?.limit || 10,
      totalCount: apiPagination?.total || 0,
      totalPages: apiPagination?.pages || 1,
    };

    return {
      success: true,
      data: res.data || [],
      pagination: mappedPagination,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch BAPs",
      data: [],
      pagination: null,
    };
  }
};

// Get BAP by ID
export const getBAPById = async (id: string): Promise<APIResponse<BAP>> => {
  try {
    if (!id) {
      console.error("BAP ID kosong");
      return {
        success: false,
        error: "BAP ID is required",
      };
    }

    const data = await fetchAPI(`/api/bap/getBAPById/${id}`);

    // Validasi response
    if (!data) {
      return {
        success: false,
        error: "No data received from API",
      };
    }

    // Validate response with schema
    const validatedData = BAPSchema.parse(data);

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    console.error("Error dalam getBAPById:", error);

    if (error instanceof z.ZodError) {
      console.error("Zod validation errors:", error.errors);
      return {
        success: false,
        error: "Invalid BAP data format",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch BAP",
    };
  }
};

// Create new BAP
export const createBAP = async (
  input: Omit<BAPCreateInput, "photos"> & { photos?: BAPPhotoInput[] }
) => {
  try {
    const photos = input.photos ?? [];
    const hasFile = photos.some((p) => p.photoUrl instanceof File);

    let res: Response;

    if (hasFile) {
      const formData = new FormData();

      // Field utama BAP
      Object.entries(input).forEach(([key, value]) => {
        if (key !== "photos" && value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // ✅ FIX: Hapus parameter index yang tidak digunakan
      const manualPhotos = photos.filter((p) => p.photoUrl instanceof File);
      const spkPhotos = photos.filter(
        (p) => typeof p.photoUrl === "string" && p.photoUrl.trim() !== ""
      );

      // 1. Untuk foto MANUAL (file upload)
      manualPhotos.forEach((photo) => {
        // Hapus index
        if (photo.photoUrl instanceof File) {
          formData.append("photos", photo.photoUrl);
          formData.append("captions", photo.caption || "");
          formData.append("categories", photo.category);
          formData.append("sources", "manual");
        }
      });

      // 2. Untuk foto SPK (string paths)
      spkPhotos.forEach((photo) => {
        // Hapus index
        formData.append("photoPaths", photo.photoUrl);
        formData.append("captions", photo.caption || "");
        formData.append("categories", photo.category);
        formData.append("sources", "spk");
      });

      for (const [key, value] of formData.entries()) {
        console.log(key, value instanceof File ? `File: ${value.name}` : value);
      }

      res = await fetch(`${API_BASE_URL}/api/bap/createBAP`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
    } else {
      // Mode JSON (full SPK)
      const spkData = {
        ...input,
        photos: photos.map((photo) => ({
          photoUrl: photo.photoUrl,
          category: photo.category,
          caption: photo.caption || null,
          source: "spk",
        })),
      };

      res = await fetch(`${API_BASE_URL}/api/bap/createBAP`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(spkData),
      });
    }

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    return { success: true, data, message: "BAP created successfully" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create BAP",
    };
  }
};

// Update BAP
export const updateBAP = async (id: string, input: BAPUpdateInput) => {
  try {
    // Validate input
    const validatedInput = BAPUpdateSchema.parse(input);

    const data = await fetchAPI(`/api/bap/updateBAP/${id}`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify(validatedInput),
    });

    const validatedData = BAPSchema.parse(data);

    return {
      success: true,
      data: validatedData,
      message: "BAP updated successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update BAP",
    };
  }
};

export const deleteBAP = async (id: string) => {
  try {
    const data = await fetchAPI(`/api/bap/deleteBAP/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    return {
      success: true,
      message: "BAP berhasil dihapus",
      data,
    };
  } catch (error) {
    console.error("Error deleting BAP:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus BAP",
    };
  }
};

// Approve BAP
export const approveBAP = async (id: string) => {
  try {
    const data = await fetchAPI(`/approveBAP/${id}/approve`, {
      method: "PATCH",
      credentials: "include",
    });

    const validatedData = BAPSchema.parse(data);

    return {
      success: true,
      data: validatedData,
      message: "BAP approved successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve BAP",
    };
  }
};

// Upload photo (separate function if needed)
export const uploadBAPPhoto = async (file: File) => {
  try {
    // Implementasi upload ke storage service (Cloudinary, S3, dll)
    // Ini contoh placeholder, sesuaikan dengan service yang digunakan

    const formData = new FormData();
    formData.append("file", file);

    // Ganti dengan endpoint upload yang sesuai
    const response = await fetch(`${API_BASE_URL}/api/bap/uploadBAPPhoto`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        photoUrl: data.url,
        // other metadata jika diperlukan
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload photo",
    };
  }
};

// Get BAPs by Sales Order
export const getBAPsBySalesOrder = async (salesOrderId: string) => {
  try {
    const data = await fetchAPI(`/baps?salesOrderId=${salesOrderId}`);

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch BAPs",
    };
  }
};

// Get BAP statistics
export const getBAPStatistics = async () => {
  try {
    const data = await fetchAPI("/baps/stats");

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch statistics",
    };
  }
};
