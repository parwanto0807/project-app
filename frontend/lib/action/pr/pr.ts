"use server";

import {
  PurchaseRequest,
  CreatePurchaseRequestData,
  UpdatePurchaseRequestData,
  UpdatePurchaseRequestStatusData,
  PurchaseRequestFilters,
  PurchaseRequestResponse,
  PaginationInfo,
} from "@/types/pr";
import {
  CreatePurchaseRequestSchema,
  UpdatePurchaseRequestSchema,
  UpdatePurchaseRequestStatusSchema,
} from "@/schemas/pr/index";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const errorData = await response.json().catch(() => null);
      if (errorData) {
        if (typeof errorData.error === "string") {
          throw new Error(errorData.error);
        } else if (Array.isArray(errorData)) {
          // Jika error berupa array of objects (Zod errors)
          const errorMessages = errorData
            .map((err) =>
              typeof err === "object" && err.message
                ? err.message
                : JSON.stringify(err)
            )
            .join(", ");
          throw new Error(errorMessages);
        } else if (typeof errorData === "object") {
          // Coba extract message dari object
          const message =
            errorData.message ||
            errorData.error?.message ||
            JSON.stringify(errorData);
          throw new Error(message);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
    }

    // Jika bukan JSON response
    const text = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status} - ${text || response.statusText}`
    );
  }
  return response.json();
}

export async function getAllPurchaseRequestBySpkId(
  spkId: string
): Promise<PurchaseRequest[]> {
  try {
    const url = `${API_BASE_URL}/api/pr/getPurchaseRequestBySpkId`;

    const response = await fetch(url, {
      method: "POST", // body karena kita ambil spkId dari form/body
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({ spkId }),
    });

    const result: PurchaseRequestResponse = await handleResponse(response);
    return Array.isArray(result.data) ? result.data : [result.data];
  } catch (error) {
    console.error("Error fetching purchase requests by spkId:", error);
    throw error;
  }
}

export async function getAllPurchaseRequests(
  filters?: PurchaseRequestFilters
): Promise<{ data: PurchaseRequest[]; pagination: PaginationInfo }> {
  try {
    const queryParams = new URLSearchParams();

    if (filters?.projectId) queryParams.append("projectId", filters.projectId);
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.dateFrom)
      queryParams.append(
        "dateFrom",
        filters.dateFrom.toISOString().split("T")[0]
      );
    if (filters?.dateTo)
      queryParams.append("dateTo", filters.dateTo.toISOString().split("T")[0]);
    if (filters?.karyawanId)
      queryParams.append("karyawanId", filters.karyawanId);
    if (filters?.spkId) queryParams.append("spkId", filters.spkId);

    // pagination (default fallback)
    queryParams.append("page", (filters?.page ?? 1).toString());
    queryParams.append("limit", (filters?.limit ?? 10).toString());

    if (filters?.search) queryParams.append("search", filters.search);
    if (filters?.type) queryParams.append("type", filters.type);

    // ✅ Always include existing POs to show PO numbers in PR list
    queryParams.append("includeExistingPOs", "true");

    const url = `${API_BASE_URL}/api/pr/getAllPurchaseRequests${queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const result: PurchaseRequestResponse = await handleResponse(response);
    return {
      data: Array.isArray(result.data)
        ? result.data
        : result.data
          ? [result.data]
          : [],
      pagination: result.pagination ?? {
        page: filters?.page ?? 1,
        limit: filters?.limit ?? 10,
        totalPages: 1,
        totalCount: 0,
      },
    };
  } catch (error) {
    console.error("Error fetching purchase requests:", error);
    throw error;
  }
}

export async function getPurchaseRequestsByProject(
  projectId: string
): Promise<PurchaseRequest[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pr/getPurchaseRequestsByProject/${projectId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const result: PurchaseRequestResponse = await handleResponse(response);
    return Array.isArray(result.data) ? result.data : [result.data];
  } catch (error) {
    console.error(
      `Error fetching purchase requests for project ${projectId}:`,
      error
    );
    throw error;
  }
}

export async function getPurchaseRequestById(
  id: string
): Promise<PurchaseRequest> {
  console.log("ID", id);
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pr/getPurchaseRequestById/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      }
    );

    const result: PurchaseRequestResponse = await handleResponse(response);
    return Array.isArray(result.data) ? result.data[0] : result.data;
  } catch (error) {
    console.error(`Error fetching purchase request ${id}:`, error);
    throw error;
  }
}

export async function createPurchaseRequest(
  data: CreatePurchaseRequestData
): Promise<PurchaseRequest> {
  try {
    // Validate input data dengan schema yang sudah diperbaiki
    const validatedData = CreatePurchaseRequestSchema.parse(data);

    // Calculate total costs untuk details
    const detailsWithTotalCost = validatedData.details.map((detail) => ({
      ...detail,
      estimasiTotalHarga: detail.jumlah * detail.estimasiHargaSatuan,
    }));

    const totalAmount = detailsWithTotalCost.reduce(
      (sum, detail) => sum + detail.estimasiTotalHarga,
      0
    );

    const requestData = {
      ...validatedData,
      details: detailsWithTotalCost,
      totalAmount,
      // Pastikan spkId null jika undefined atau empty string
      spkId: validatedData.spkId || null,
    };

    const response = await fetch(
      `${API_BASE_URL}/api/pr/createPurchaseRequest`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    const result: PurchaseRequestResponse = await handleResponse(response);
    return Array.isArray(result.data) ? result.data[0] : result.data;
  } catch (error) {
    console.error("Error creating purchase request:", error);
    throw error;
  }
}

export async function updatePurchaseRequest(
  id: string,
  data: UpdatePurchaseRequestData
): Promise<PurchaseRequest> {
  try {
    // Normalisasi details -> pastikan jumlah & harga jadi number
    const normalizedDetails = data.details?.map((d) => ({
      ...d,
      jumlah: d.jumlah !== undefined ? Number(d.jumlah) : 0,
      estimasiHargaSatuan:
        d.estimasiHargaSatuan !== undefined ? Number(d.estimasiHargaSatuan) : 0,
    }));

    const validatedData = UpdatePurchaseRequestSchema.parse({
      ...data,
      details: normalizedDetails,
    });

    // Recalculate totals
    let updateData = { ...validatedData };
    if (validatedData.details) {
      const detailsWithTotalCost = validatedData.details.map((detail) => ({
        ...detail,
        estimasiTotalHarga: detail.jumlah * detail.estimasiHargaSatuan,
      }));

      updateData = {
        ...updateData,
        details: detailsWithTotalCost,
      };
    }

    // Pastikan spkId null jika undefined atau empty string
    if (updateData.spkId !== undefined) {
      updateData.spkId = updateData.spkId || null;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/pr/updatePurchaseRequest/${id}`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );

    const result: PurchaseRequestResponse = await handleResponse(response);
    return Array.isArray(result.data) ? result.data[0] : result.data;
  } catch (error) {
    console.error(`Error updating purchase request ${id}:`, error);
    throw error;
  }
}

export async function updatePurchaseRequestStatus(
  id: string,
  data: UpdatePurchaseRequestStatusData
): Promise<PurchaseRequest> {
  try {
    const validatedData = UpdatePurchaseRequestStatusSchema.parse(data);

    const updateData = {
      ...validatedData,
      ...(validatedData.status === "REVISION_NEEDED" && {
        reviewedDate: new Date(),
      }),
      ...(validatedData.status === "APPROVED" && {
        approvedDate: new Date(),
      }),
    };

    const response = await fetch(
      `${API_BASE_URL}/api/pr/updatePurchaseRequestStatus/${id}/status`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );

    const result: PurchaseRequestResponse = await handleResponse(response);
    return Array.isArray(result.data) ? result.data[0] : result.data;
  } catch (error) {
    console.error(`Error updating purchase request status ${id}:`, error);
    throw error;
  }
}

export async function deletePurchaseRequest(id: string): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pr/deletePurchaseRequest/${id}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    await handleResponse(response);
  } catch (error) {
    console.error(`Error deleting purchase request ${id}:`, error);
    throw error;
  }
}

// Fungsi tambahan untuk mendapatkan PR berdasarkan SPK
export async function getPurchaseRequestsBySPK(
  spkId: string
): Promise<PurchaseRequest[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pr/getPurchaseRequestsBySPK/${spkId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const result: PurchaseRequestResponse = await handleResponse(response);
    return Array.isArray(result.data) ? result.data : [result.data];
  } catch (error) {
    console.error(`Error fetching purchase requests for SPK ${spkId}:`, error);
    throw error;
  }
}

// Fungsi untuk mendapatkan PR berdasarkan karyawan
export async function getPurchaseRequestsByKaryawan(
  karyawanId: string
): Promise<PurchaseRequest[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pr/getPurchaseRequestsByKaryawan/${karyawanId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const result: PurchaseRequestResponse = await handleResponse(response);
    return Array.isArray(result.data) ? result.data : [result.data];
  } catch (error) {
    console.error(
      `Error fetching purchase requests for karyawan ${karyawanId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get approved Purchase Requests that have purchase items (PEMBELIAN_BARANG)
 * These PRs can be converted to Purchase Orders
 */
export async function getApprovedPRsForPO(): Promise<PurchaseRequest[]> {
  try {
    // We fetch both APPROVED and COMPLETED PRs
    const [approvedRes, completedRes] = await Promise.all([
      fetch(
        `${API_BASE_URL}/api/pr/getAllPurchaseRequests?status=APPROVED&limit=100&includeExistingPOs=true`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      ),
      fetch(
        `${API_BASE_URL}/api/pr/getAllPurchaseRequests?status=COMPLETED&limit=100&includeExistingPOs=true`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      )
    ]);

    const approvedResult: PurchaseRequestResponse = await handleResponse(approvedRes);
    const completedResult: PurchaseRequestResponse = await handleResponse(completedRes);

    const approvedData = Array.isArray(approvedResult.data) ? approvedResult.data : approvedResult.data ? [approvedResult.data] : [];
    const completedData = Array.isArray(completedResult.data) ? completedResult.data : completedResult.data ? [completedResult.data] : [];

    // Combine and remove any potential duplicates
    const allPRs = [...approvedData, ...completedData];

    // Sort by tanggalPr (newest first)
    allPRs.sort((a, b) => {
      const dateA = new Date(a.tanggalPr).getTime();
      const dateB = new Date(b.tanggalPr).getTime();
      return dateB - dateA;
    });

    // Filter PRs that have at least one purchase item (PEMBELIAN_BARANG or JASA_PEMBELIAN)
    const prsWithPurchaseItems = allPRs.filter(pr =>
      pr.details && pr.details.some(detail =>
        detail.sourceProduct === 'PEMBELIAN_BARANG' || detail.sourceProduct === 'JASA_PEMBELIAN'
      )
    );

    return prsWithPurchaseItems;
  } catch (error) {
    console.error("Error fetching approved/completed PRs for PO:", error);
    throw error;
  }
}
