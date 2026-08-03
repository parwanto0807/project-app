"use server";

import { cookies } from "next/headers";

export async function fetchAllKegiatan(filters: {
  startDate?: string;
  endDate?: string;
  karyawanId?: string;
  status?: string;
} = {}) {
  try {
    const cookieStore = await cookies();
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
    if (filters.karyawanId) queryParams.append("karyawanId", filters.karyawanId);
    if (filters.status) queryParams.append("status", filters.status);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan-absensi?${queryParams.toString()}`,
      {
        method: "GET",
        headers: { Cookie: cookieStore.toString() },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);
    const data = await res.json();
    return { kegiatan: data || [], isLoading: false };
  } catch (error) {
    console.error("[fetchAllKegiatan]", error);
    return { kegiatan: [], isLoading: false, error: (error as Error).message };
  }
}

export async function deleteKegiatan(id: string) {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan-absensi/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Cookie: cookieStore.toString() },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal menghapus kegiatan");
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}