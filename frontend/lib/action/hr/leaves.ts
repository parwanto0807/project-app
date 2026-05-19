"use server";

import { cookies } from "next/headers";

export async function fetchAllLeaves(filters: {
  status?: string;
  jenis?: string;
  karyawanId?: string;
} = {}) {
  try {
    const cookieStore = await cookies();
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.jenis) queryParams.append("jenis", filters.jenis);
    if (filters.karyawanId) queryParams.append("karyawanId", filters.karyawanId);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/hr/leaves?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          Cookie: cookieStore.toString(),
        },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error(`Gagal memuat data ijin/cuti: ${res.status}`);
    const data = await res.json();
    return { leaves: data || [], isLoading: false };
  } catch (error) {
    console.error("[fetchAllLeaves]", error);
    return { leaves: [], isLoading: false, error: (error as Error).message };
  }
}

export async function approveLeave(id: string) {
  try {
    const cookieStore = await cookies();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/hr/leaves/${id}/approve`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieStore.toString(),
        },
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal menyetujui pengajuan");
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function rejectLeave(id: string, rejectedReason: string) {
  try {
    const cookieStore = await cookies();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/hr/leaves/${id}/reject`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieStore.toString(),
        },
        body: JSON.stringify({ rejectedReason }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal menolak pengajuan");
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
