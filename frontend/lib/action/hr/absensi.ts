"use server";

import { cookies } from "next/headers";

export async function fetchAllAbsensi(filters: {
  startDate?: string;
  endDate?: string;
  karyawanId?: string;
  employeeName?: string;
  needsValidation?: boolean;
  teamId?: string;
} = {}) {
  try {
    const cookieStore = await cookies();
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
    if (filters.karyawanId) queryParams.append("karyawanId", filters.karyawanId);
    if (filters.employeeName) queryParams.append("employeeName", filters.employeeName);
    if (filters.needsValidation) queryParams.append("needsValidation", "true");
    if (filters.teamId && filters.teamId !== "ALL") queryParams.append("teamId", filters.teamId);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/absensi?${queryParams.toString()}`,
      { 
        method: "GET", 
        headers: {
          Cookie: cookieStore.toString(),
        },
        cache: "no-store" 
      }
    );
    if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);
    const data = await res.json();
    return { absensi: data || [], isLoading: false };
  } catch (error) {
    console.error("[fetchAllAbsensi]", error);
    return { absensi: [], isLoading: false, error: (error as Error).message };
  }
}

export async function validateAbsensi(
  id: string,
  data: { jamKeluarDisetujui: string; catatanValidasi?: string; jamLembur?: number }
) {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/absensi/${id}/validate`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal validasi absensi");
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function approveAbsensi(id: string, catatanValidasi?: string) {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/absensi/${id}/approve`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
      },
      body: JSON.stringify({ catatanValidasi }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal approve absensi");
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function fetchAbsensiStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { absensi } = await fetchAllAbsensi({ startDate: today, endDate: today });
    
    const stats = {
      total: absensi.length,
      hadir: absensi.filter((a: any) => a.status === "HADIR").length,
      terlambat: absensi.filter((a: any) => a.status === "TERLAMBAT").length,
      izin: absensi.filter((a: any) => a.status === "IZIN" || a.status === "SAKIT").length,
      alfa: absensi.filter((a: any) => a.status === "ALFA").length,
    };

    return stats;
  } catch (error) {
    console.error("[fetchAbsensiStats]", error);
    return null;
  }
}

export async function createManualAbsensi(data: {
  karyawanId: string;
  tanggal: string;
  jamMasuk: string | null;
  jamKeluar: string | null;
  status: string;
  keterangan: string;
}) {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/absensi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal membuat absensi manual");
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteAbsensi(id: string) {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/absensi/${id}`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal menghapus absensi");
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateAbsensiAction(id: string, data: { tanggal?: string | null; jamMasuk?: string | null; jamKeluar?: string | null; status?: string; keterangan?: string }) {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/absensi/${id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal mengubah absensi");
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
