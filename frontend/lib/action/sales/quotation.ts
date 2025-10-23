import {
  CreateQuotationRequest,
  UpdateQuotationRequest,
  UpdateQuotationStatusRequest,
  AddCommentRequest,
  Quotation,
  QuotationSummary,
  UploadAttachmentRequest,
  QuotationApiResponse,
} from "@/types/quotation";
import { QuotationStatus } from "@/types/quotation";

import { ListResponse } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Helper function untuk handle API responses
// Tambahkan function handleResponse yang lebih robust
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "Request failed";

    try {
      // Coba parse error message dari response
      const errorText = await response.text();

      if (errorText) {
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Jika bukan JSON, gunakan text langsung
          errorMessage = errorText;
        }
      } else {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
    } catch (parseError) {
      console.error("Error parsing error response:", parseError);
      errorMessage = response.statusText || `HTTP ${response.status}`;
    }

    throw new Error(errorMessage);
  }

  try {
    const data = await response.json();
    return data;
  } catch (parseError) {
    console.error("Error parsing success response:", parseError);
    throw new Error("Invalid response format from server");
  }
}

// GET - Get all quotations dengan filter dan pagination
export async function getQuotations(params?: {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<ListResponse<QuotationSummary>> {
  try {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `${API_BASE_URL}/api/quotations/getQuotations${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        console.error("❌ Cannot parse error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    // Debug: Lihat response sebenarnya
    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      throw new Error("Invalid JSON response from server");
    }

    // Handle response berdasarkan struktur sebenarnya
    if (Array.isArray(result)) {
      return {
        data: result,
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || result.length,
          total: result.length,
          pages: Math.ceil(result.length / (params?.limit || result.length)),
        },
      };
    } else if (result.data !== undefined) {
      return {
        data: result.data || [],
        pagination: result.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: result.total || result.data?.length || 0,
          pages:
            result.pages ||
            Math.ceil(
              (result.total || result.data?.length || 0) / (params?.limit || 10)
            ),
        },
      };
    } else if (result.quotations !== undefined) {
      return {
        data: result.quotations || [],
        pagination: result.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: result.total || result.quotations?.length || 0,
          pages:
            result.pages ||
            Math.ceil(
              (result.total || result.quotations?.length || 0) /
                (params?.limit || 10)
            ),
        },
      };
    } else {
      return {
        data: result || [],
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: Array.isArray(result) ? result.length : 0,
          pages: Math.ceil(
            (Array.isArray(result) ? result.length : 0) / (params?.limit || 10)
          ),
        },
      };
    }
  } catch (error) {
    console.error("💥 getQuotations error:", error);
    throw error;
  }
}

// GET - Get quotation by ID
export async function getQuotationById(
  id: string
): Promise<QuotationApiResponse> {
  if (!id) {
    throw new Error("Quotation ID is required");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/quotations/getQuotationById${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    }
  );
  return handleResponse<QuotationApiResponse>(response);
}

// POST - Create new quotation
export async function createQuotation(
  quotationData: CreateQuotationRequest
): Promise<Quotation> {
  // Validasi input
  if (!quotationData.customerId) {
    throw new Error("Customer ID is required");
  }

  if (!quotationData.lines || quotationData.lines.length === 0) {
    throw new Error("At least one quotation line is required");
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/quotations/createQuotation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(quotationData),
      }
    );

    const result = await handleResponse<Quotation>(response);
    return result;
  } catch (error) {
    console.error("❌ createQuotation error:", error);
    throw error; // Re-throw agar ditangani oleh caller
  }
}

// PUT - Update quotation
export async function updateQuotation(
  id: string,
  quotationData: UpdateQuotationRequest
): Promise<Quotation> {
  if (!id) {
    throw new Error("Quotation ID is required");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/quotations/updateQuotation${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(quotationData),
    }
  );

  return handleResponse<Quotation>(response);
}

// DELETE - Delete quotation
export async function deleteQuotation(
  id: string
): Promise<{ message: string }> {
  if (!id) {
    throw new Error("Quotation ID is required");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/quotations/deleteQuotation${id}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  return handleResponse<{ message: string }>(response);
}

// PATCH - Update quotation status
export async function updateQuotationStatus(
  id: string,
  statusData: UpdateQuotationStatusRequest
): Promise<Quotation> {
  if (!id) {
    throw new Error("Quotation ID is required");
  }

  const response = await fetch(
    `${API_BASE_URL}/quotations/updateQuotationStatus${id}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(statusData),
    }
  );

  return handleResponse<Quotation>(response);
}

// POST - Upload attachment
export async function uploadAttachment(
  id: string,
  formData: FormData
): Promise<UploadAttachmentRequest> {
  if (!id) {
    throw new Error("Quotation ID is required");
  }

  const response = await fetch(
    `${API_BASE_URL}/quotations/uploadAttachment${id}/attachments`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
      // Note: Don't set Content-Type header for FormData, browser will set it automatically
    }
  );

  return handleResponse<UploadAttachmentRequest>(response);
}

// DELETE - Delete attachment
export async function deleteAttachment(
  id: string,
  attachmentId: string
): Promise<{ message: string }> {
  if (!id || !attachmentId) {
    throw new Error("Quotation ID and Attachment ID are required");
  }

  const response = await fetch(
    `${API_BASE_URL}/quotations/deleteAttachment${id}/attachments/${attachmentId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  return handleResponse<{ message: string }>(response);
}

// POST - Add comment
export async function addComment(
  id: string,
  commentData: AddCommentRequest
): Promise<AddCommentRequest> {
  if (!id) {
    throw new Error("Quotation ID is required");
  }

  const response = await fetch(
    `${API_BASE_URL}/quotations/addComment${id}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(commentData),
    }
  );

  return handleResponse<AddCommentRequest>(response);
}

// GET - Download quotation as PDF
export async function downloadQuotationPDF(id: string): Promise<Blob> {
  if (!id) {
    throw new Error("Quotation ID is required");
  }

  const response = await fetch(`${API_BASE_URL}/quotations/${id}/pdf`, {
    method: "GET",
    headers: {
      "Content-Type": "application/pdf",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }

  return response.blob();
}

// Utility functions untuk quotation management
export const quotationActions = {
  // Status management helpers
  async sendQuotation(id: string, actedBy: string): Promise<Quotation> {
    return updateQuotationStatus(id, {
      status: QuotationStatus.SENT,
      actedBy,
      notes: "Quotation sent to customer",
    });
  },

  async approveQuotation(
    id: string,
    actedBy: string,
    notes?: string
  ): Promise<Quotation> {
    return updateQuotationStatus(id, {
      status: QuotationStatus.APPROVED,
      actedBy,
      notes: notes || "Quotation approved",
    });
  },

  async rejectQuotation(
    id: string,
    actedBy: string,
    notes?: string
  ): Promise<Quotation> {
    return updateQuotationStatus(id, {
      status: QuotationStatus.REJECTED,
      actedBy,
      notes: notes || "Quotation rejected",
    });
  },

  async cancelQuotation(
    id: string,
    actedBy: string,
    notes?: string
  ): Promise<Quotation> {
    return updateQuotationStatus(id, {
      status: QuotationStatus.CANCELLED,
      actedBy,
      notes: notes || "Quotation cancelled",
    });
  },

  // Bulk operations
  async bulkUpdateStatus(
    ids: string[],
    status: QuotationStatus, // ✅ gunakan enum, bukan string
    actedBy: string,
    notes?: string
  ): Promise<Quotation[]> {
    const results = await Promise.allSettled(
      ids.map((id) =>
        updateQuotationStatus(id, {
          status, // ✅ sudah type-safe
          actedBy,
          notes: notes || `Bulk status update to ${status}`,
        })
      )
    );

    const successful: Quotation[] = [];
    const failed: { id: string; error: string }[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successful.push(result.value);
      } else {
        failed.push({
          id: ids[index],
          error: result.reason.message,
        });
      }
    });

    if (failed.length > 0) {
      console.warn("Some quotations failed to update:", failed);
    }

    return successful;
  },
};

// Hook-style functions untuk React components
export function useQuotationActions() {
  return {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    updateQuotationStatus,
    uploadAttachment,
    deleteAttachment,
    addComment,
    downloadQuotationPDF,
    ...quotationActions,
  };
}

const quotationService = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  uploadAttachment,
  deleteAttachment,
  addComment,
  downloadQuotationPDF,
  quotationActions,
  useQuotationActions,
};

export default quotationService;
