"use server";

import { z } from "zod";
import { salesOrderUpdateSchema } from "@/schemas";
import { cookies } from "next/headers";
import { getAuthHeaders, getCookieHeader } from "@/lib/cookie-utils";
import { apiFetch } from "@/lib/apiFetch";
import { unstable_noStore as noStore } from "next/cache";

// form schema utk create/update header+items (tanpa soNumber karena digenerate)
const formSchema = salesOrderUpdateSchema.omit({ soNumber: true });
type UpdateSalesOrderPayload = z.infer<typeof formSchema>;

// bulan -> Romawi (0..11)
function toRoman(monthIndex: number): string {
  const romanMonths = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  return romanMonths[monthIndex];
}
function romanToIndex(roman: string): number {
  const map: Record<string, number> = {
    I: 0,
    II: 1,
    III: 2,
    IV: 3,
    V: 4,
    VI: 5,
    VII: 6,
    VIII: 7,
    IX: 8,
    X: 9,
    XI: 10,
    XII: 11,
  };
  return map[roman] ?? -1;
}

/** Nomor SO baru: NNNN/RYLIF-SO/MM_ROMAN/YYYY, reset tiap bulan */
async function generateNewSoNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  const monthRoman = toRoman(monthIdx);
  const staticCode = "RYLIF-SO";

  let lastSO: { soNumber?: string } | null = null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/sales-orders-last`,
      { cache: "no-store" }
    );
    if (res.ok) lastSO = await res.json();
  } catch (e) {
    console.error("Error fetching last SO:", e);
  }

  let nextSeq = 1;
  // Contoh format: 0042/RYLIF-SO/VIII/2025
  const m = lastSO?.soNumber?.match(
    /^(\d{4})\/RYLIF-SO\/([IVXLCDM]+)\/(\d{4})$/
  );
  if (m) {
    const [, seqStr, roman, yStr] = m;
    const lastYear = Number(yStr);
    const lastMonthIdx = romanToIndex(roman);
    if (lastYear === year && lastMonthIdx === monthIdx) {
      nextSeq = parseInt(seqStr, 10) + 1;
    }
  }

  const seqPadded = String(nextSeq).padStart(4, "0");
  return `${seqPadded}/${staticCode}/${monthRoman}/${year}`;
}

// ===============================================================
// CREATE SALES ORDER
// ===============================================================
export async function createSalesOrderAPI(payload: z.infer<typeof formSchema>) {
  const validated = formSchema.safeParse(payload);
  if (!validated.success) return { error: "Data tidak valid." };

  try {
    // ✅ GUNAKAN REUSABLE FUNCTION
    const headers = await getAuthHeaders();

    // ✅ DEBUG: Check jika Authorization header ada
    if (!headers.Authorization) {
      return { error: "Access token tidak ditemukan. Silakan login kembali." };
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/sales-orders/create`,
      {
        method: "POST",
        headers, // ✅ Gunakan headers yang sudah dipersiapkan
        body: JSON.stringify({
          ...validated.data,
          soNumber: await generateNewSoNumber(),
        }),
        cache: "no-store",
        // ❌ HAPUS credentials: "include" (tidak needed dengan Authorization header)
      }
    );

    console.log("📡 [CREATE SO DEBUG] Response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = "Gagal membuat Sales Order.";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // Tetap gunakan default message
      }

      return { error: errorMessage };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error creating sales order:", error);
    return { error: "Terjadi kesalahan saat membuat Sales Order" };
  }
}

// ===============================================================
// UPDATE SALES ORDER (header + replace-all items)
// endpoint backend: PUT /sales-orders/:id  -> salesOrder.updateWithItems
// ===============================================================
export async function updateSalesOrderAPI(
  id: string,
  payload: UpdateSalesOrderPayload
) {
  const validated = formSchema.safeParse(payload);
  if (!validated.success) return { error: "Data tidak valid." };

  try {
    // 🔑 GUNAKAN AUTHORIZATION HEADER sebagai solusi
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    console.log(
      "🔑 [AUTH DEBUG] Access Token:",
      accessToken ? `${accessToken.substring(0, 20)}...` : "MISSING"
    );

    if (!accessToken) {
      return { error: "Access token tidak ditemukan. Silakan login kembali." };
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/sales-orders/update/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          // Tetap kirim cookies juga sebagai backup
          Cookie: await getCookieHeader(),
        },
        body: JSON.stringify(validated.data),
        credentials: "include",
        cache: "no-store",
      }
    );

    console.log("📡 [AUTH DEBUG] Response status:", res.status);

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ message: "Gagal memperbarui Sales Order." }));
      return { error: err.message || "Terjadi kesalahan pada server." };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error updating sales order:", error);
    return { error: "Terjadi kesalahan saat memperbarui Sales Order" };
  }
}

// ===============================================================
// FETCH LIST & DETAIL
// ===============================================================
export async function fetchAllSalesOrder(
  page: number = 1,
  pageSize: number = 50,
  search: string = "",
  status: string = "" // Tambahkan parameter status
) {
  noStore(); // ⬅️ memastikan data selalu fresh
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  // Build URL dengan parameter status
  const urlParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search: encodeURIComponent(search),
  });

  // Tambahkan status ke URL jika tidak "ALL" atau empty
  if (status && status !== "ALL") {
    urlParams.set("status", status);
  }

  const url = `${base}/api/salesOrder/sales-orders?${urlParams.toString()}`;

  try {
    const response = await apiFetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    return {
      data: response.data ?? [],
      pagination: response.pagination ?? {
        currentPage: page,
        pageSize,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    throw error;
  }
}

export async function fetchAllSalesOrderInvoice() {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const url = `${base}/api/salesOrder/sales-orders-invoice`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include", // kalau butuh cookie auth
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Failed to fetch: ${res.status} ${res.statusText} | ${text}`
      );
    }

    const data = await res.json();

    return { salesOrders: data || [], isLoading: false };
  } catch (error) {
    console.error("[fetchAllSalesOrder]", error);
    return { salesOrders: [], isLoading: false };
  }
}

export async function fetchAllSalesOrderBap() {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const url = `${base}/api/salesOrder/sales-orders-bap`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include", // kalau butuh cookie auth
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Failed to fetch: ${res.status} ${res.statusText} | ${text}`
      );
    }

    const data = await res.json();
    return { salesOrders: data || [], isLoading: false };
  } catch (error) {
    console.error("[fetchAllSalesOrder]", error);
    return { salesOrders: [], isLoading: false };
  }
}

export async function fetchSalesOrderById(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/sales-orders/getById/${id}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      }
    );
    if (!res.ok) throw new Error(`Failed to fetch sales order: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("[fetchSalesOrderById]", error);
    throw error;
  }
}

export async function fetchAllSalesOrderSPK() {
  noStore(); // memastikan selalu fetch fresh data

  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const url = `${base}/api/salesOrder/sales-orders-spk`; // ⬅️ tanpa query params

  try {
    const response = await apiFetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    return {
      data: response.data ?? [],
    };
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    throw error;
  }
}
