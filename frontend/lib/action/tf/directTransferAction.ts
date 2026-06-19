'use server';

import { serverApi } from "@/lib/server-api";
import { ApiResponse } from "@/types/api";

export interface DirectTransferInput {
  fromWarehouseId: string;
  toWarehouseId: string;
  senderId: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unit: string;
    pricePerUnit?: number;
  }>;
}

export async function createDirectTransfer(
  input: DirectTransferInput
): Promise<ApiResponse<any>> {
  try {
    const res = await serverApi.post<ApiResponse<any>>(
      '/api/tf/direct',
      input
    );

    return res.data;
  } catch (error: any) {
    console.error("Server Action Error [createDirectTransfer]:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal membuat direct transfer",
      error: error.response?.data?.error || "SERVER_ERROR",
      details: error.message
    };
  }
}

export async function getTransfers(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    fromWarehouseId?: string;
    toWarehouseId?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<ApiResponse<any>> {
  try {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
    );

    const res = await serverApi.get<ApiResponse<any>>(
      '/api/tf',
      { params: cleanParams }
    );

    return res.data;
  } catch (error: any) {
    console.error("Server Action Error [getTransfers]:", error);
    return {
      success: false,
      message: "Gagal mengambil data transfer",
      error: error.response?.data?.error || "SERVER_ERROR",
      details: error.message
    };
  }
}
