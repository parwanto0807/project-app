import { api } from "@/lib/http";
import {
  TermOfPayment,
  CreateTermOfPaymentInput,
  UpdateTermOfPaymentInput,
  TermOfPaymentListResponse,
  TermOfPaymentDetailResponse,
} from "@/types/supplierType";
import { AxiosError } from "axios";

// GET ALL TERM OF PAYMENTS
export async function fetchTermOfPayments(): Promise<TermOfPayment[]> {
  try {
    const response = await api.get<TermOfPaymentListResponse>(
      "/api/term-of-payments"
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error("Failed to fetch term of payments");
  } catch (error) {
    console.error("Error fetching term of payments:", error);
    return [];
  }
}

// GET SINGLE TERM OF PAYMENT
export async function fetchTermOfPaymentById(
  id: string
): Promise<TermOfPayment | null> {
  try {
    const response = await api.get<TermOfPaymentDetailResponse>(
      `/api/term-of-payments/${id}`
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error("Term of payment not found");
  } catch (error) {
    console.error(`Error fetching term of payment ${id}:`, error);
    return null;
  }
}

// CREATE TERM OF PAYMENT
export async function createTermOfPayment(
  data: CreateTermOfPaymentInput
): Promise<TermOfPaymentDetailResponse> {
  try {
    const response = await api.post<TermOfPaymentDetailResponse>(
      "/api/term-of-payments",
      data
    );
    return response.data;
  } catch (error) {
    // Type guard untuk AxiosError
    if (error instanceof AxiosError && error.response) {
      const errorMessage =
        error.response.data?.message || "Failed to create term of payment";
      throw new Error(errorMessage);
    }

    // Handle non-Axios errors
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to create term of payment");
  }
}

// UPDATE TERM OF PAYMENT
export async function updateTermOfPayment(
  data: UpdateTermOfPaymentInput
): Promise<TermOfPaymentDetailResponse> {
  try {
    const { id, ...updateData } = data;
    const response = await api.put<TermOfPaymentDetailResponse>(
      `/api/term-of-payments/${id}`,
      updateData
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage =
        error.response.data?.message || "Failed to update term of payment";
      throw new Error(errorMessage);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to update term of payment");
  }
}

// DELETE TERM OF PAYMENT
export async function deleteTermOfPayment(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await api.delete(`/api/term-of-payments/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage =
        error.response.data?.message || "Failed to delete term of payment";
      throw new Error(errorMessage);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to delete term of payment");
  }
}

// GET TERM OF PAYMENTS FOR SELECT DROPDOWN
export async function fetchTermOfPaymentsForSelect(): Promise<
  Array<{ value: string; label: string; days?: number }>
> {
  try {
    const termOfPayments = await fetchTermOfPayments();

    return termOfPayments.map((term) => ({
      value: term.id,
      label: `${term.name} (${term.days} days)`,
      days: term.days,
    }));
  } catch (error) {
    console.error("Error fetching term of payments for select:", error);
    return [];
  }
}
