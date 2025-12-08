import { api } from "@/lib/http";
import {
  SupplierListResponse,
  SupplierDetailResponse,
  SupplierDeleteResponse,
  CreateSupplierInput,
  UpdateSupplierInput,
} from "@/types/supplierType";
import { AxiosError } from "axios";

// Definisikan type untuk validation error dari backend
interface ValidationError {
  field: string;
  message: string;
}

interface BackendErrorResponse {
  message?: string;
  error?: string;
  errors?: ValidationError[];
}

export async function createSupplier(
  data: CreateSupplierInput
): Promise<SupplierDetailResponse> {
  try {
    console.log('📤 [createSupplier] Sending data:', data);
    
    const response = await api.post<SupplierDetailResponse>(
      "/api/supplier",
      data
    );
    
    console.log('✅ [createSupplier] Success:', response.data);
    return response.data;
    
  } catch (error) {
    if (error instanceof AxiosError) {
      const responseData = error.response?.data as BackendErrorResponse;
      
      console.group('❌ VALIDATION ERRORS');
      console.error('Status:', error.response?.status);
      console.error('Message:', responseData?.message);
      console.error('Full Response:', responseData);
      
      // Jika ada array errors
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        console.error('Validation Errors:');
        responseData.errors.forEach((err: ValidationError, index: number) => {
          console.error(`  ${index + 1}. ${err.field}: ${err.message}`);
        });
      }
      
      console.groupEnd();
      
      // Extract error message
      let errorMessage = responseData?.message || 'Validasi Gagal';
      
      // Tambah detail validation errors jika ada
      if (responseData?.errors) {
        const errorDetails = responseData.errors
          .map((err: ValidationError) => `${err.field}: ${err.message}`)
          .join(', ');
        errorMessage += ` (${errorDetails})`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Handle unknown error
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to create supplier: Unknown error';
    
    throw new Error(errorMessage);
  }
}

export async function generateSupplierCode(): Promise<string> {
  const res = await api.get("/api/supplier/generate-code");
  if (!res.data?.code) {
    throw new Error("Invalid response from server: missing code");
  }
  return res.data.code;
}

export async function fetchSuppliers(params?: {
  page?: number;
  limit?: number;
  activeOnly?: boolean | string;
  includePagination?: boolean | string;
  search?: string;
}): Promise<SupplierListResponse> {
  const response = await api.get<SupplierListResponse>("/api/supplier", {
    params,
  });
  return response.data;
}

export async function fetchSupplierById(
  id: string
): Promise<SupplierDetailResponse> {
  const response = await api.get<SupplierDetailResponse>(`/api/supplier/${id}`);
  return response.data;
}


export async function updateSupplier(
  id: string,
  data: UpdateSupplierInput
): Promise<SupplierDetailResponse> {
  const response = await api.put<SupplierDetailResponse>(
    `/api/supplier/${id}`,
    data
  );
  return response.data;
}

export async function deleteSupplier(
  id: string
): Promise<SupplierDeleteResponse> {
  const response = await api.delete<SupplierDeleteResponse>(
    `/api/supplier/${id}`
  );
  return response.data;
}
