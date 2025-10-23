"use server";

import { z } from "zod";
import { salesOrderUpdateSchema } from "@/schemas";
import { cookies } from "next/headers";

// form schema utk create/update header+items (tanpa soNumber karena digenerate)
const formSchema = salesOrderUpdateSchema.omit({ soNumber: true });
type UpdateSalesOrderPayload = z.infer<typeof formSchema>;

// ===============================================================
// Helpers
// ===============================================================

type SimpleCookie = { name: string; value: string };

/** Build Cookie header string dari Next cookies() */
async function getCookieHeader(): Promise<string> {
  // ✅ di env kamu, cookies() mengembalikan Promise — Wajib await
  const store = await cookies();
  const all = store.getAll() as SimpleCookie[];
  return all.map((c: SimpleCookie) => `${c.name}=${c.value}`).join("; ");
}

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

  const cookieHeader = await getCookieHeader();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/sales-orders/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      credentials:'include',
      body: JSON.stringify({
        ...validated.data,
        soNumber: await generateNewSoNumber(),
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: "Gagal membuat Sales Order." }));
    return { error: err.message || "Terjadi kesalahan pada server." };
  }
  const data = await res.json();
  return { success: true, data };
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
    const cookieHeader = await getCookieHeader();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/sales-orders/update/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify(validated.data),
        credentials:'include',
        cache: "no-store",
      }
    );

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
export async function fetchAllSalesOrder() {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const url = `${base}/api/salesOrder/sales-orders`;

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

