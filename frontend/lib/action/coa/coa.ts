import {
  CoaFormData,
  CoaFilter,
  CoaListResponse,
  CoaResponse,
  CoaHierarchyResponse,
  CoaDeletionStatus,
} from "@/types/coa";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Custom error class untuk COA-specific errors
class CoaApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "CoaApiError";
  }
}

// Helper function untuk handle fetch response
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = `HTTP error! status: ${response.status}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new CoaApiError(errorMessage, response.status);
  }

  return response.json();
}

export const coaApi = {
  async getCOAs(filters: CoaFilter = {}): Promise<CoaListResponse> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE}/api/coa/getAllCOA?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Tambahkan cache configuration jika diperlukan
        // next: { revalidate: 60 } // untuk Next.js
      });

      return await handleResponse<CoaListResponse>(response);
    } catch (error) {
      if (error instanceof CoaApiError) {
        throw error;
      }
      throw new CoaApiError("Failed to fetch COA list");
    }
  },

  async getCOAById(id: string): Promise<CoaResponse> {
    try {
      if (!id) {
        throw new CoaApiError("COA ID is required");
      }

      const response = await fetch(`${API_BASE}/api/coa/getCOAById${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      return await handleResponse<CoaResponse>(response);
    } catch (error) {
      if (error instanceof CoaApiError) {
        throw error;
      }
      throw new CoaApiError("Failed to fetch COA details");
    }
  },

  async getCOAHierarchy(type?: string): Promise<CoaHierarchyResponse> {
    try {
      const params = new URLSearchParams();
      if (type) params.append("type", type);

      const response = await fetch(`${API_BASE}/hierarchy?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await handleResponse<CoaHierarchyResponse>(response);
    } catch (error) {
      if (error instanceof CoaApiError) {
        throw error;
      }
      throw new CoaApiError("Failed to fetch COA hierarchy");
    }
  },

  async createCOA(data: CoaFormData): Promise<CoaResponse> {
    console.log("DATA DITERIMA", data);
    try {
      // Basic validation sebelum request
      if (!data.code || !data.name || !data.type || !data.normalBalance) {
        throw new CoaApiError("Required fields are missing");
      }

      const response = await fetch(`${API_BASE}/api/coa/createCOA`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      return await handleResponse<CoaResponse>(response);
    } catch (error) {
      if (error instanceof CoaApiError) {
        throw error;
      }
      throw new CoaApiError("Failed to create COA");
    }
  },

  async updateCOA(
    id: string,
    data: Partial<CoaFormData>
  ): Promise<CoaResponse> {
    try {
      if (!id) {
        throw new CoaApiError("COA ID is required for update");
      }

      const response = await fetch(`${API_BASE}/api/coa/updateCOA${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials:'include',
        body: JSON.stringify(data),
      });

      return await handleResponse<CoaResponse>(response);
    } catch (error) {
      if (error instanceof CoaApiError) {
        throw error;
      }
      throw new CoaApiError("Failed to update COA");
    }
  },

  async deleteCOA(id: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!id) {
        throw new CoaApiError("COA ID is required for deletion");
      }

      const response = await fetch(`${API_BASE}/api/coa/deleteCOA${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await handleResponse<{ success: boolean; message: string }>(
        response
      );
    } catch (error) {
      if (error instanceof CoaApiError) {
        throw error;
      }
      throw new CoaApiError("Failed to delete COA");
    }
  },

  async deactivateCOA(id: string): Promise<CoaResponse> {
    try {
      if (!id) {
        throw new CoaApiError("COA ID is required for deactivation");
      }

      const response = await fetch(`${API_BASE}/${id}/deactivate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await handleResponse<CoaResponse>(response);
    } catch (error) {
      if (error instanceof CoaApiError) {
        throw error;
      }
      throw new CoaApiError("Failed to deactivate COA");
    }
  },

  async activateCOA(id: string): Promise<CoaResponse> {
    try {
      if (!id) {
        throw new CoaApiError("COA ID is required for activation");
      }

      const response = await fetch(`${API_BASE}/${id}/activate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await handleResponse<CoaResponse>(response);
    } catch (error) {
      if (error instanceof CoaApiError) {
        throw error;
      }
      throw new CoaApiError("Failed to activate COA");
    }
  },
};

// Utility functions tambahan
export const coaUtils = {
  /**
   * Check if COA can be deleted (no children, no journal entries, no product associations)
   */
  canDeleteCOA(coa: CoaDeletionStatus): boolean {
    const hasChildren = coa.children && coa.children.length > 0;
    const hasJournalLines = coa.journalLines && coa.journalLines.length > 0;
    const hasProductAssociations =
      (coa.productsAsRevenue && coa.productsAsRevenue.length > 0) ||
      (coa.productsAsCogs && coa.productsAsCogs.length > 0) ||
      (coa.productsAsInventory && coa.productsAsInventory.length > 0) ||
      (coa.paidFromAccount && coa.paidFromAccount.length > 0) ||
      (coa.expenseAccount && coa.expenseAccount.length > 0);

    return !hasChildren && !hasJournalLines && !hasProductAssociations;
  },

  /**
   * Get deletion constraints for COA (untuk menampilkan pesan error yang spesifik)
   */
  getDeletionConstraints(coa: CoaDeletionStatus): string[] {
    const constraints: string[] = [];

    if (coa.children?.length) {
      constraints.push(`Memiliki ${coa.children.length} akun anak`);
    }

    if (coa.journalLines?.length) {
      constraints.push(`Memiliki ${coa.journalLines.length} entri jurnal`);
    }

    if (coa.productsAsRevenue?.length) {
      constraints.push(
        `Digunakan sebagai akun pendapatan untuk ${coa.productsAsRevenue.length} produk`
      );
    }

    if (coa.productsAsCogs?.length) {
      constraints.push(
        `Digunakan sebagai akun HPP untuk ${coa.productsAsCogs.length} produk`
      );
    }

    if (coa.productsAsInventory?.length) {
      constraints.push(
        `Digunakan sebagai akun inventory untuk ${coa.productsAsInventory.length} produk`
      );
    }

    if (coa.paidFromAccount?.length) {
      constraints.push(
        `Digunakan sebagai akun pembayaran untuk ${coa.paidFromAccount.length} expense`
      );
    }

    if (coa.expenseAccount?.length) {
      constraints.push(
        `Digunakan sebagai akun expense untuk ${coa.expenseAccount.length} expense`
      );
    }

    return constraints;
  },
};
// Export types untuk convenience
