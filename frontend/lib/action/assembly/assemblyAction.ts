"use server";

import { serverApi } from "@/lib/server-api";
import { ApiResponse } from "@/types/api";

export interface AssemblyComponentInput {
  productId: string;
  quantity: number;
  unit: string;
  cogs?: number;
}

export interface CreateAssemblyInput {
  warehouseId: string;
  outputProductId: string;
  outputQuantity: number;
  outputUnit: string;
  outputCogs?: number;
  notes?: string;
  createdById?: string;
  components: AssemblyComponentInput[];
}

export async function createAssembly(
  input: CreateAssemblyInput
): Promise<ApiResponse<any>> {
  try {
    const res = await serverApi.post<ApiResponse<any>>("/api/assembly", input);
    return res.data;
  } catch (error: any) {
    console.error("Server Action Error [createAssembly]:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal membuat perakitan",
      error: error.response?.data?.error || "SERVER_ERROR",
      details: error.message,
    };
  }
}

export async function getAssemblies(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  warehouseId?: string;
} = {}): Promise<ApiResponse<any>> {
  try {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
    );

    const res = await serverApi.get<ApiResponse<any>>("/api/assembly", {
      params: cleanParams,
    });

    return res.data;
  } catch (error: any) {
    console.error("Server Action Error [getAssemblies]:", error);
    return {
      success: false,
      message: "Gagal mengambil data perakitan",
      error: error.response?.data?.error || "SERVER_ERROR",
      details: error.message,
    };
  }
}

export async function getAssemblyById(id: string): Promise<ApiResponse<any>> {
  try {
    const res = await serverApi.get<ApiResponse<any>>(`/api/assembly/${id}`);
    return res.data;
  } catch (error: any) {
    console.error("Server Action Error [getAssemblyById]:", error);
    return {
      success: false,
      message: "Gagal mengambil detail perakitan",
      error: error.response?.data?.error || "SERVER_ERROR",
      details: error.message,
    };
  }
}

export async function completeAssembly(id: string): Promise<ApiResponse<any>> {
  try {
    const res = await serverApi.post<ApiResponse<any>>(`/api/assembly/${id}/complete`, {});
    return res.data;
  } catch (error: any) {
    console.error("Server Action Error [completeAssembly]:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal menyelesaikan perakitan",
      error: error.response?.data?.error || "SERVER_ERROR",
      details: error.message,
    };
  }
}

export async function cancelAssembly(id: string): Promise<ApiResponse<any>> {
  try {
    const res = await serverApi.post<ApiResponse<any>>(`/api/assembly/${id}/cancel`, {});
    return res.data;
  } catch (error: any) {
    console.error("Server Action Error [cancelAssembly]:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal membatalkan perakitan",
      error: error.response?.data?.error || "SERVER_ERROR",
      details: error.message,
    };
  }
}
