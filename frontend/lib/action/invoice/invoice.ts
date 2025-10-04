"use server";

import { revalidatePath } from "next/cache";
import {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceStatusRequest,
  AddPaymentRequest,
  RejectInvoiceRequest,
  InvoiceFilters,
  InvoiceStats,
  PaginatedInvoices,
  UpdateInvoiceRequest,
} from "@/schemas/invoice/index";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
}

export async function getInvoices(
  filters: InvoiceFilters = {}
): Promise<PaginatedInvoices> {
  const params = new URLSearchParams();
  params.append("page", "1");
  params.append("limit", "10");

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(
    `${API_BASE_URL}/api/invoice/getInvoices?${params.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }
  );
  if (!response.ok) {
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }

  let result: PaginatedInvoices & { message?: string };

  try {
    result = await response.json();
  } catch {
    throw new Error("Invalid JSON response");
  }

  return result;
}

// lib/action/invoice/invoice.ts
export async function getInvoiceByID(
  id: string
): Promise<{ success: boolean; data?: Invoice; message?: string }> {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/invoice/getInvoiceById/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, message: `Invoice with ID ${id} not found` };
      }
      if (res.status === 500) {
        return {
          success: false,
          message: "Server error occurred while fetching invoice",
        };
      }
      return {
        success: false,
        message: `Failed to fetch invoice: ${res.status} ${res.statusText}`,
      };
    }

    // Sesuaikan dengan response API
    const json = await res.json();
    return { success: true, data: json.data as Invoice };
  } catch (error: unknown) {
    console.error("Get invoice error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return {
      success: false,
      message: "An unknown error occurred while fetching the invoice",
    };
  }
}

// Jika Anda tahu endpoint yang tepat, gunakan langsung
// lib/action/invoice/invoice.ts
export async function updateInvoice(
  id: string,
  payload: UpdateInvoiceRequest
): Promise<{ success: boolean; data?: Invoice; message?: string }> {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    return { success: false, message: "NEXT_PUBLIC_API_URL is not defined" };
  }

  try {
    const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/invoice/updateInvoice/${id}`;

    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Server error response:", errorText);

      try {
        const errorData = JSON.parse(errorText);
        console.error("❌ Parsed error data:", errorData);

        // Handle specific server errors
        if (res.status === 500) {
          if (errorText.includes("calculateInvoiceTotals")) {
            return {
              success: false,
              message:
                "Server calculation error. The system is temporarily unavailable. Please try again later or contact support.",
            };
          }
          return {
            success: false,
            message:
              "Server error occurred. Please try again in a few minutes.",
          };
        }

        return {
          success: false,
          message:
            errorData.message || `Failed to update invoice: ${res.status}`,
        };
      } catch (parseError) {
        console.error("❌ Error parsing error response:", parseError);
        return {
          success: false,
          message: `Server error: ${res.status} ${res.statusText}`,
        };
      }
    }

    const data: Invoice = await res.json();
    return { success: true, data };
  } catch (error: unknown) {
    console.error("❌ Update invoice error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return {
      success: false,
      message: "Network error occurred. Please check your connection.",
    };
  }
}

export async function getInvoiceStats(year?: number): Promise<InvoiceStats> {
  const params = new URLSearchParams();
  if (year) {
    params.append("year", year.toString());
  }

  const response = await fetch(
    `${API_BASE_URL}/invoice/stats?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  return handleResponse<InvoiceStats>(response);
}

type CreateInvoiceResponse = {
  success: boolean;
  message: string;
  data: Invoice;
};

export async function createInvoice(
  invoiceData: CreateInvoiceRequest
): Promise<CreateInvoiceResponse> {
  const response = await fetch(`${API_BASE_URL}/api/invoice/createInvoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(invoiceData),
  });

  // parse sesuai response backend
  const result = await handleResponse<CreateInvoiceResponse>(response);

  // kalau mau langsung pakai datanya aja:
  // return result.data;

  // kalau butuh message dan success juga:
  return result;
}

export async function updateInvoiceStatus(
  id: string,
  statusData: UpdateInvoiceStatusRequest
): Promise<Invoice> {
  const response = await fetch(`${API_BASE_URL}/invoice/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(statusData),
  });

  const result = await handleResponse<Invoice>(response);
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return result;
}

export async function addPayment(
  id: string,
  paymentData: AddPaymentRequest
): Promise<Invoice> {
  const response = await fetch(
    `${API_BASE_URL}/api/invoice/addPayment/${id}/payments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(paymentData),
    }
  );

  const result = await handleResponse<Invoice>(response);
  revalidatePath("/admin-area/finance/invoice");
  return result;
}

export async function deleteInvoice(id: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/invoice/deleteInvoice/${id}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data?.message || `HTTP error! status: ${response.status}`);
  }
}

export async function approveInvoice(id: string): Promise<Invoice> {
  try {
    // URL yang benar berdasarkan route backend
    const url = `${API_BASE_URL}/api/invoice/${id}/approve`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const result = await response.json();

    // Revalidate paths untuk refresh data
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${id}`);

    return result;
  } catch (error) {
    console.error("Error in approveInvoice:", error);
    throw error;
  }
}

export async function rejectInvoice(
  id: string,
  rejectData: RejectInvoiceRequest
): Promise<Invoice> {
  const response = await fetch(`${API_BASE_URL}/invoice/${id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(rejectData),
  });

  const result = await handleResponse<Invoice>(response);
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return result;
}
