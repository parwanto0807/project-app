"use server";

import { z } from "zod";
import { createSalesOrderSchema } from "@/schemas";
import { cookies } from "next/headers";

const formSchema = createSalesOrderSchema.omit({ soNumber: true });

//=================================================================
// CREATE SALES ORDER
//=================================================================

// Helper untuk mengubah bulan (0-11) menjadi Romawi
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

/**
 * Fungsi internal untuk menghasilkan nomor SO baru secara otomatis.
 */
async function generateNewSoNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const staticCode = "RYLIF-SO";
  const monthRoman = toRoman(month);

  // Ganti query Prisma dengan fetch ke API backend
  let lastSalesOrder = null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/last-order`,
      {
        method: "GET",
        cache: "no-store", // Selalu ambil data terbaru
      }
    );

    if (res.ok) {
      lastSalesOrder = await res.json();
    } else {
      console.error("Failed to fetch last SO:", res.statusText);
    }
  } catch (error) {
    console.error("Error fetching last SO from API:", error);
  }

  let nextSequence = 1;

  // Logika selanjutnya tetap sama, menggunakan data dari hasil fetch
  if (lastSalesOrder && lastSalesOrder.soNumber) {
    const lastSoNumber = lastSalesOrder.soNumber;
    const lastSequenceStr = lastSoNumber.split("/")[0];
    const lastSequenceInt = parseInt(lastSequenceStr, 10);
    nextSequence = lastSequenceInt + 1;
  }

  const nextSequencePadded = String(nextSequence).padStart(4, "0");
  const newSoNumber = `${nextSequencePadded}/${staticCode}/${monthRoman}/${year}`;

  return newSoNumber;
}

/**
 * Server Action utama untuk membuat Sales Order baru.
 */
export async function createSalesOrderAPI(payload: z.infer<typeof formSchema>) {
  const validated = formSchema.safeParse(payload)
  if (!validated.success) return { error: 'Data tidak valid.' }

  // ✅ cookies() perlu di-await di Server Action
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
    .join('; ')

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/createSalesOrders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader, // ✅ teruskan cookie ke backend
    },
    body: JSON.stringify({
      ...validated.data,
      soNumber: await generateNewSoNumber(),
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Gagal membuat Sales Order.' }))
    return { error: err.message || 'Terjadi kesalahan pada server.' }
  }

  const data = await res.json()
  return { success: true, data }
}

export async function fetchAllSalesOrder() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/getAllSalesOrders`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    const data = await res.json();
    return {
      salesOrders: data || [], // ✅ directly use data
      isLoading: false,
    };
  } catch (error) {
    console.error("[fetchAllSalesOrder]", error);
    return {
      salesOrders: [],
      isLoading: false,
    };
  }
}
