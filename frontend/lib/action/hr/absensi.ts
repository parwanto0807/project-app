"use server";

export async function fetchAllAbsensi(filters: {
  startDate?: string;
  endDate?: string;
  karyawanId?: string;
} = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
    if (filters.karyawanId) queryParams.append("karyawanId", filters.karyawanId);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/absensi?${queryParams.toString()}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
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
